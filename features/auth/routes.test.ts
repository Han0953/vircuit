import { beforeEach, describe, expect, it, vi } from "vitest";
const { client, jar } = vi.hoisted(() => ({ jar: { get: vi.fn(), delete: vi.fn() }, client: { auth: { signUp: vi.fn(), signInWithPassword: vi.fn(), signInWithOAuth: vi.fn(), signOut: vi.fn(), exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn(), getUser: vi.fn(), getSession: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn() } } }));
vi.mock("next/headers", () => ({ cookies: async () => jar }));
vi.mock("@/lib/supabase/server", () => ({ serverClient: async () => client }));
vi.mock("@/lib/supabase/env", () => ({ supabaseEnv: () => ({ url: "https://auth.example.test", key: "test-publishable" }) }));
import { POST } from "../../app/api/auth/[action]/route";
import { GET } from "../../app/auth/callback/route";
import { recoveryProof } from "./recovery";
const request = (body: unknown) => new Request("https://vircuit.test/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://vircuit.test" }, body: JSON.stringify(body) });
const credentials = { email: "user@example.test", password: "test-password" };
describe("auth server routes", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.restoreAllMocks(); client.auth.getUser.mockResolvedValue({ data: { user: { id: "user-one" } }, error: null }); client.auth.getSession.mockResolvedValue({ data: { session: { access_token: "test-session" } } }); });
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
    expect(client.auth.signInWithOAuth.mock.calls[0][0].options.queryParams).toEqual({ prompt: "select_account" });
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
  it("supports bounded email-change confirmation hashes and returns to settings", async () => {
    client.auth.verifyOtp.mockResolvedValue({ error: null });
    const response = await GET(new Request("https://vircuit.test/auth/callback?token_hash=test-hash&type=email_change&next=%2Fdashboard%2Fpengaturan"));
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "test-hash", type: "email_change" });
    expect(response.headers.get("location")).toBe("https://vircuit.test/dashboard/pengaturan");
    client.auth.verifyOtp.mockClear();
    await GET(new Request("https://vircuit.test/auth/callback?token_hash=test-hash&type=magiclink&next=%2Fdashboard%2Fpengaturan"));
    expect(client.auth.verifyOtp).not.toHaveBeenCalled();
  });
  it("does not create an entrance marker when callback has no verified session", async () => {
    client.auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    client.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await GET(new Request("https://vircuit.test/auth/callback?code=test-code"));
    expect(response.headers.get("location")).toContain("/masuk?error=callback");
    expect(response.cookies.get("vircuit-auth-entry")).toBeUndefined();
  });
  it("issues recovery proof only after verified exchange and directs to reset", async () => {
    client.auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await GET(new Request("https://vircuit.test/auth/callback?code=test-code&flow=recovery&next=https://evil.test"));
    expect(response.headers.get("location")).toBe("https://vircuit.test/atur-ulang-kata-sandi");
    expect(response.cookies.get("vircuit-password-recovery")?.httpOnly).toBe(true);
    expect(response.cookies.get("vircuit-auth-entry")).toBeUndefined();
  });
  it("rejects reset without recovery proof and returns generic recovery acknowledgement", async () => {
    const values = { password: "new-password", confirmation: "new-password" };
    expect((await POST(request(values), { params: Promise.resolve({ action: "reset" }) })).status).toBe(401);
    expect(client.auth.updateUser).not.toHaveBeenCalled();
    client.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    const response = await POST(request({ email: "user@example.test" }), { params: Promise.resolve({ action: "recover" }) });
    expect(await response.json()).toEqual({ ok: true });
    expect(client.auth.resetPasswordForEmail.mock.calls[0][1].redirectTo).toBe("https://vircuit.test/auth/callback?flow=recovery");
  });
  it("updates a password only with same-session proof and consumes recovery", async () => {
    jar.get.mockReturnValue({ value: recoveryProof("test-session") });
    client.auth.updateUser.mockResolvedValue({ error: null });
    const response = await POST(request({ password: "new-password", confirmation: "new-password" }), { params: Promise.resolve({ action: "reset" }) });
    expect(response.status).toBe(200);
    expect(client.auth.updateUser).toHaveBeenCalledWith({ password: "new-password" });
    expect(jar.delete).toHaveBeenCalledWith("vircuit-password-recovery");
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    client.auth.updateUser.mockClear();
    jar.get.mockReturnValue({ value: recoveryProof("other-session") });
    expect((await POST(request({ password: "new-password", confirmation: "new-password" }), { params: Promise.resolve({ action: "reset" }) })).status).toBe(401);
    expect(client.auth.updateUser).not.toHaveBeenCalled();
  });
  it("fails closed when callback verification throws", async () => {
    client.auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    client.auth.getUser.mockRejectedValue(new Error("offline"));
    const response = await GET(new Request("https://vircuit.test/auth/callback?code=test-code"));
    expect(response.headers.get("location")).toContain("/masuk?error=callback");
    expect(response.cookies.get("vircuit-auth-entry")).toBeUndefined();
  });
});
