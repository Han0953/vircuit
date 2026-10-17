import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareStoryWhenIdle } from "@/components/marketing/scenes/story-preparation";

function harness() {
  vi.useFakeTimers();
  const win = Object.assign(new EventTarget(), {
    setTimeout: windowTimeout,
    clearTimeout: (id: number) => clearTimeout(id),
    requestIdleCallback: vi.fn((run: () => void) => windowTimeout(run, 1)),
    cancelIdleCallback: (id: number) => clearTimeout(id),
  });
  function windowTimeout(run: () => void, delay: number) { return Number(setTimeout(run, delay)); }
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const media = Object.assign(new EventTarget(), { matches: false });
  const hero = { dataset: { heroIntro: "complete" } };
  let changed = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("matchMedia", () => media);
  vi.stubGlobal("MutationObserver", class {
    constructor(callback: () => void) { changed = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const host = { closest: () => ({ querySelector: () => hero }) } as unknown as HTMLElement;
  const prepare = vi.fn();
  const allowed = vi.fn(() => true);
  const cancel = prepareStoryWhenIdle(host, prepare, allowed);
  return { win, doc, media, hero, prepare, allowed, cancel, disconnect, changed: () => changed() };
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("idle preparation of the deferred story renderer", () => {
  it("waits for the complete hero entrance and prepares only once", () => {
    const h = harness(); h.hero.dataset.heroIntro = "playing";
    vi.advanceTimersByTime(1000); expect(h.prepare).not.toHaveBeenCalled();
    h.hero.dataset.heroIntro = "complete"; h.changed();
    vi.advanceTimersByTime(180); expect(h.prepare).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(h.prepare).toHaveBeenCalledTimes(1);
    h.win.dispatchEvent(new Event("scroll")); vi.advanceTimersByTime(1000);
    expect(h.prepare).toHaveBeenCalledTimes(1); expect(h.disconnect).toHaveBeenCalled();
  });

  it("cancels queued idle work as soon as wheel or touch input starts", () => {
    const h = harness();
    vi.advanceTimersByTime(180);
    h.win.dispatchEvent(new Event("wheel")); vi.advanceTimersByTime(100);
    h.win.dispatchEvent(new Event("touchmove")); vi.advanceTimersByTime(180);
    expect(h.prepare).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(h.prepare).toHaveBeenCalledTimes(1);
  });

  it("waits for reduced motion and background tabs to become eligible", () => {
    const h = harness(); h.doc.hidden = true;
    vi.advanceTimersByTime(181); expect(h.prepare).not.toHaveBeenCalled();
    h.doc.hidden = false; h.media.matches = true; h.doc.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(181); expect(h.prepare).not.toHaveBeenCalled();
    h.media.matches = false; h.media.dispatchEvent(new Event("change"));
    vi.advanceTimersByTime(181); expect(h.prepare).toHaveBeenCalledTimes(1);
  });

  it("does not prepare a skipped or unsupported scene", () => {
    const h = harness(); h.allowed.mockReturnValue(false);
    vi.advanceTimersByTime(181); expect(h.prepare).not.toHaveBeenCalled();
    h.cancel();
  });

  it("cancels the idle callback and all listeners on route teardown", () => {
    const h = harness(); vi.advanceTimersByTime(180); h.cancel();
    h.win.dispatchEvent(new Event("scroll")); h.changed(); vi.advanceTimersByTime(1000);
    expect(h.prepare).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });

  it("uses a cancellable quiet timer when requestIdleCallback is unavailable", () => {
    const h = harness(); Reflect.deleteProperty(h.win, "requestIdleCallback");
    vi.advanceTimersByTime(180); expect(h.prepare).toHaveBeenCalledTimes(1);
  });
});
