import { beforeEach, describe, expect, it, vi } from "vitest";
const { client } = vi.hoisted(() => ({ client: { auth: { signUp: vi.fn(), signInWithPassword: vi.fn(), signInWithOAuth: vi.fn(), signOut: vi.fn(), exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn() } } }));
vi.mock("@/lib/supabase/server", () => ({ serverClient: async () => client }));
vi.mock("@/lib/supabase/env", () => ({ supabaseEnv: () => ({ url: "https://auth.example.test", key: "test-publishable" }) }));
import { POST } from "../../app/api/auth/[action]/route";
import { GET } from "../../app/auth/callback/route";
const request = (body: unknown) => new Request("https://vircuit.test/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://vircuit.test" }, body: JSON.stringify(body) });
const credentials = { email: "user@example.test", password: "test-password" };
describe("auth server routes", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.restoreAllMocks(); });
  it("handles email confirmation without returning tokens", async () => {
    client.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const response = await POST(request({ credentials, next: "https://evil.test" }), { params: Promise.resolve({ action: "register" }) });
    expect(await response.json()).toEqual({ confirmation: true, next: "/simulator" });
    expect(client.auth.signUp.mock.calls[0][0].options.emailRedirectTo).toBe("https://vircuit.test/auth/callback?next=%2Fsimulator");
  });
  it("uses generic invalid-credential errors", async () => {
    client.auth.signInWithPassword.mockResolvedValue({ error: { message: "Sensitive provider detail" } });
    const response = await POST(request({ credentials }), { params: Promise.resolve({ action: "login" }) });
    expect(response.status).toBe(401); expect(await response.text()).not.toContain("Sensitive provider");
  });
  it("reports disabled Google and constructs safe enabled callback", async () => {
    const settings = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ external: { google: false } })).mockResolvedValueOnce(Response.json({ external: { google: true } }));
    expect((await POST(request({ next: "//evil.test" }), { params: Promise.resolve({ action: "google" }) })).status).toBe(503);
    expect(client.auth.signInWithOAuth).not.toHaveBeenCalled();
    client.auth.signInWithOAuth.mockResolvedValue({ data: { url: "https://auth.example.test/authorize" }, error: null });
    expect((await POST(request({ next: "//evil.test" }), { params: Promise.resolve({ action: "google" }) })).status).toBe(200);
    expect(client.auth.signInWithOAuth.mock.calls[0][0].options.redirectTo).toBe("https://vircuit.test/auth/callback?next=%2Fsimulator"); settings.mockRestore();
  });
  it("exchanges callback and refuses external redirect on success/failure", async () => {
    client.auth.exchangeCodeForSession.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { message: "expired" } });
    const success = await GET(new Request("https://vircuit.test/auth/callback?code=test-code&next=https://evil.test"));
    expect(success.headers.get("location")).toBe("https://vircuit.test/simulator");
    const failed = await GET(new Request("https://vircuit.test/auth/callback?code=test-code&next=https://evil.test"));
    expect(failed.headers.get("location")).toBe("https://vircuit.test/masuk?error=callback&next=%2Fsimulator");
    expect(failed.headers.get("cache-control")).toContain("no-store");
  });
  it("logs out the local session and protects origin", async () => {
    client.auth.signOut.mockResolvedValue({ error: null });
    expect((await POST(request({}), { params: Promise.resolve({ action: "logout" }) })).status).toBe(200);
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    const hostile = new Request("https://vircuit.test/api/auth/logout", { method: "POST", headers: { Origin: "https://evil.test", "Content-Type": "application/json" }, body: "{}" });
    expect((await POST(hostile, { params: Promise.resolve({ action: "logout" }) })).status).toBe(403);
  });
});
