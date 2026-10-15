import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestSceneRefresh } from "../../components/marketing/scenes/scene-refresh";
import { ScrollTrigger } from "gsap/ScrollTrigger";

vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { refresh: vi.fn() } }));

describe("marketing scene refresh scheduling", () => {
  const frames = new Map<number, FrameRequestCallback>();
  let moving = false;
  let nextFrame = 0;
  let cancel: Array<() => void> = [];
  const flush = () => {
    const pending = [...frames.values()]; frames.clear();
    pending.forEach((callback) => callback(0));
    vi.runOnlyPendingTimers();
  };

  beforeEach(() => {
    vi.useFakeTimers(); vi.mocked(ScrollTrigger.refresh).mockClear();
    moving = false; nextFrame = 0; frames.clear(); cancel = [];
    vi.stubGlobal("document", { documentElement: { hasAttribute: () => moving } });
    vi.stubGlobal("window", Object.assign(new EventTarget(), { setTimeout, clearTimeout }));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  });

  afterEach(() => { cancel.forEach((stop) => stop()); vi.unstubAllGlobals(); vi.useRealTimers(); });

  it("coalesces scene requests and yields until after the next paint", () => {
    cancel.push(requestSceneRefresh(), requestSceneRefresh(), requestSceneRefresh());
    expect(frames.size).toBe(1);
    expect(ScrollTrigger.refresh).not.toHaveBeenCalled();
    const pending = [...frames.values()]; frames.clear(); pending.forEach((callback) => callback(0));
    expect(ScrollTrigger.refresh).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(ScrollTrigger.refresh).toHaveBeenCalledTimes(1);
  });

  it("cancels unmounted owners without cancelling other live scenes", () => {
    const first = requestSceneRefresh(); cancel.push(first, requestSceneRefresh());
    first(); flush();
    expect(ScrollTrigger.refresh).toHaveBeenCalledTimes(1);
    const last = requestSceneRefresh(); last(); flush();
    expect(ScrollTrigger.refresh).toHaveBeenCalledTimes(1);
  });

  it("waits for native anchor scrolling to settle and cleans up deferred work", () => {
    moving = true; cancel.push(requestSceneRefresh(), requestSceneRefresh());
    flush(); expect(ScrollTrigger.refresh).not.toHaveBeenCalled();
    moving = false; window.dispatchEvent(new Event("home-scroll-settled")); flush();
    expect(ScrollTrigger.refresh).toHaveBeenCalledTimes(1);
    moving = true; const stop = requestSceneRefresh(); stop();
    moving = false; window.dispatchEvent(new Event("home-scroll-settled")); flush();
    expect(ScrollTrigger.refresh).toHaveBeenCalledTimes(1);
  });

  it("defers lazy scene measurement until native scroll momentum settles", () => {
    cancel.push(requestSceneRefresh());
    window.dispatchEvent(new Event("scroll"));
    expect(frames.size).toBe(0);
    vi.advanceTimersByTime(119);
    expect(ScrollTrigger.refresh).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(119);
    expect(ScrollTrigger.refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); flush();
    expect(ScrollTrigger.refresh).toHaveBeenCalledTimes(1);
  });

  it("removes pending scroll work when the last scene unmounts", () => {
    const stop = requestSceneRefresh();
    window.dispatchEvent(new Event("scroll")); stop();
    window.dispatchEvent(new Event("scroll")); flush();
    expect(ScrollTrigger.refresh).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });
});
