import { beforeEach, describe, expect, it, vi } from "vitest";
const { client, user } = vi.hoisted(() => ({ client: { rpc: vi.fn(), auth: { reauthenticate: vi.fn(), updateUser: vi.fn(), signInWithPassword: vi.fn() } }, user: { id: "11111111-1111-4111-8111-111111111111", email: "a@example.test", identities: [{ provider: "email" }] } }));
vi.mock("@/features/projects/server/service", () => ({ authenticatedClient: vi.fn(async () => ({ client, user })) }));
import { authenticatedClient } from "@/features/projects/server/service";
import { PATCH } from "@/app/api/settings/profile/route";
import { POST } from "@/app/api/settings/account/route";
import { RequestError } from "@/lib/request-security";
const request = (body: unknown, owner = user.id, origin = "https://vircuit.test") => new Request("https://vircuit.test/api/settings/account", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "x-vircuit-owner": owner }, body: JSON.stringify(body) });
describe("settings server authorization and auth flows", () => {
  beforeEach(() => { vi.clearAllMocks(); user.identities = [{ provider: "email" }]; });
  it("authenticates owner, rejects forged fields and origin, writes only own canonical profile", async () => {
    expect((await PATCH(request({ displayName: "Nadia" }, "another-owner"))).status).toBe(409);
    expect((await PATCH(request({ displayName: "Nadia", id: "other" }))).status).toBe(400);
    expect((await PATCH(request({ displayName: "Nadia" }, user.id, "https://evil.test"))).status).toBe(403);
    expect(client.rpc).not.toHaveBeenCalled();
    client.rpc.mockResolvedValue({ data: "Nadia", error: null });
    const response = await PATCH(request({ displayName: "  Nadia  " }));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ displayName: "Nadia" });
    expect(client.rpc).toHaveBeenCalledWith("update_my_profile", { p_display_name: "Nadia" });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("does not fabricate profile success on database failure or expired session", async () => {
    client.rpc.mockResolvedValue({ data: null, error: { message: "internal SQL secret" } });
    const failed = await PATCH(request({ displayName: "Nadia" })); expect(failed.status).toBe(503); expect(await failed.text()).not.toContain("internal SQL");
    vi.mocked(authenticatedClient).mockRejectedValueOnce(new RequestError("Masuk kembali.", 401));
    expect((await PATCH(request({ displayName: "Nadia" }))).status).toBe(401);
  });
  it("returns a pending email and bounded same-origin confirmation URL", async () => {
    client.auth.updateUser.mockResolvedValue({ data: { user: { email: user.email, new_email: "new@example.test" } }, error: null });
    const response = await POST(request({ action: "email", email: "new@example.test" }));
    expect(await response.json()).toMatchObject({ pendingEmail: "new@example.test" });
    expect(client.auth.updateUser).toHaveBeenCalledWith({ email: "new@example.test" }, { emailRedirectTo: "https://vircuit.test/auth/callback?next=%2Fdashboard%2Fpengaturan" });
  });
  it("requires verified current password and never writes custom credential storage", async () => {
    const values = { currentPassword: "old-password", password: "new-password", confirmation: "new-password", nonce: "" };
    client.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: {} });
    expect((await POST(request({ action: "password", values }))).status).toBe(403);
    expect(client.auth.updateUser).not.toHaveBeenCalled();
    client.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: user.id } }, error: null });
    client.auth.updateUser.mockResolvedValue({ error: null });
    expect((await POST(request({ action: "password", values }))).status).toBe(200);
    expect(client.rpc).not.toHaveBeenCalled();
    expect(client.auth.updateUser).toHaveBeenCalledWith({ password: "new-password", current_password: "old-password" });
  });
  it("requires nonce for OAuth setup and exposes supported reauthentication errors", async () => {
    user.identities = [{ provider: "google" }];
    expect((await POST(request({ action: "password", values: { password: "new-password", confirmation: "new-password", currentPassword: "", nonce: "" } }))).status).toBe(400);
    expect(client.auth.signInWithPassword).not.toHaveBeenCalled();
    client.auth.reauthenticate.mockResolvedValue({ error: null });
    expect((await POST(request({ action: "reauthenticate" }))).status).toBe(200);
    client.auth.updateUser.mockResolvedValue({ error: { message: "provider-secret" } });
    const failed = await POST(request({ action: "password", values: { password: "new-password", confirmation: "new-password", currentPassword: "", nonce: "123456" } }));
    expect(failed.status).toBe(400); expect(await failed.text()).not.toContain("provider-secret");
  });
});
