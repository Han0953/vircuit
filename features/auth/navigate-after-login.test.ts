import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), revalidate: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ serverClient: async () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, RedirectType: { replace: "replace" } }));
import { navigateAfterLogin } from "./navigate-after-login";

describe("verified login navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "verified-owner" } }, error: null });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  });
  it("invalidates private route trees before redirecting to the requested learning page", async () => {
    await expect(navigateAfterLogin("/dashboard/learn")).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.revalidate.mock.calls).toEqual([["/dashboard", "layout"], ["/simulator", "layout"]]);
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard/learn", "replace");
    expect(mocks.revalidate.mock.invocationCallOrder.at(-1)).toBeLessThan(mocks.redirect.mock.invocationCallOrder[0]);
  });
  it("does not navigate or invalidate when server authentication fails", async () => {
    for (const result of [{ data: { user: null }, error: null }, { data: { user: { id: "untrusted" } }, error: new Error("Expired") }]) {
      mocks.getUser.mockResolvedValue(result);
      await expect(navigateAfterLogin("/dashboard/learn")).rejects.toThrow("Sesi belum dapat diverifikasi");
    }
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("rejects external redirects and preserves a guest save destination", async () => {
    await expect(navigateAfterLogin("https://external.example/")).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenLastCalledWith("/simulator", "replace");
    const target = `/simulator?save=1&draft=${crypto.randomUUID()}`;
    await expect(navigateAfterLogin(target)).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenLastCalledWith(target, "replace");
  });
});
