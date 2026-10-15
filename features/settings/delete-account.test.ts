import { beforeEach, it, expect, vi } from "vitest";
const { user, client, admin } = vi.hoisted(() => ({
  user: { id: "11111111-1111-4111-8111-111111111111", email: "test@example.test", factors: [] as { status: string }[] },
  client: { auth: { signInWithPassword: vi.fn(), signInWithOtp: vi.fn(), verifyOtp: vi.fn(), signOut: vi.fn() } },
  admin: { auth: { admin: { signOut: vi.fn(), deleteUser: vi.fn() } }, storage: { from: vi.fn() }, remove: vi.fn() },
}));
vi.mock("@/features/projects/server/service", () => ({ authenticatedClient: vi.fn(async () => ({ client, user })) }));
vi.mock("@/lib/supabase/account-admin", () => ({ accountAdmin: vi.fn(() => admin) }));
import { POST } from "@/app/api/settings/delete-account/route";
import { accountAdmin } from "@/lib/supabase/account-admin";
const request = (body: unknown, owner = user.id, origin = "https://vircuit.test") => new Request("https://vircuit.test/api/settings/delete-account", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "x-vircuit-owner": owner }, body: JSON.stringify(body) });
const input = { action: "delete", confirmation: "HAPUS AKUN", password: "test-password" };
beforeEach(() => {
  vi.clearAllMocks(); user.factors = [];
  client.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: user.id }, session: { access_token: "verified-test-token" } }, error: null });
  admin.auth.admin.signOut.mockResolvedValue({ error: null }); admin.auth.admin.deleteUser.mockResolvedValue({ error: null });
  admin.remove.mockResolvedValue({ error: null }); admin.storage.from.mockReturnValue({ remove: admin.remove });
  client.auth.signOut.mockResolvedValue({ error: null });
});
it("requires explicit confirmation, same-origin, bound owner and reauthentication before privileged deletion", async () => {
  expect((await POST(request({ ...input, confirmation: "yes" }))).status).toBe(400);
  expect((await POST(request({ ...input, user_id: "other" }))).status).toBe(400);
  expect((await POST(request(input, "another"))).status).toBe(409);
  expect((await POST(request(input, user.id, "https://evil.test"))).status).toBe(403);
  client.auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: {} });
  expect((await POST(request(input))).status).toBe(403);
  expect(accountAdmin).not.toHaveBeenCalled();
});
it("revokes sessions, removes only own photo, deletes verified user and reports confirmed success", async () => {
  const response = await POST(request(input));
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ deleted: true });
  expect(admin.auth.admin.signOut).toHaveBeenCalledWith("verified-test-token", "global");
  expect(admin.remove).toHaveBeenCalledWith([`${user.id}/avatar.webp`]);
  expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith(user.id);
  expect(admin.auth.admin.signOut.mock.invocationCallOrder[0]).toBeLessThan(admin.auth.admin.deleteUser.mock.invocationCallOrder[0]);
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("does not delete when storage or session revocation fails and does not bypass MFA", async () => {
  admin.remove.mockResolvedValue({ error: {} });
  expect((await POST(request(input))).status).toBe(503); expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  user.factors = [{ status: "verified" }];
  expect((await POST(request(input))).status).toBe(403);
});
it("sends deletion code only to verified session email and rejects an OTP for another account", async () => {
  client.auth.signInWithOtp.mockResolvedValue({ error: null });
  expect((await POST(request({ action: "code" }))).status).toBe(200);
  expect(client.auth.signInWithOtp).toHaveBeenCalledWith({ email: user.email, options: { shouldCreateUser: false } });
  client.auth.verifyOtp.mockResolvedValue({ data: { user: { id: "other" }, session: { access_token: "token" } }, error: null });
  expect((await POST(request({ action: "delete", confirmation: "HAPUS AKUN", code: "123456" }))).status).toBe(403);
  expect(accountAdmin).not.toHaveBeenCalled();
});
