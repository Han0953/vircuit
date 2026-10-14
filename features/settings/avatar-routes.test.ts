import { beforeEach, it, expect, vi } from "vitest";
const { client, user, storage } = vi.hoisted(() => ({ client: { storage: { from: vi.fn() } }, user: { id: "11111111-1111-4111-8111-111111111111" }, storage: { upload: vi.fn(), download: vi.fn(), remove: vi.fn() } }));
vi.mock("@/features/projects/server/service", () => ({ authenticatedClient: vi.fn(async () => ({ client, user })) }));
import { GET, POST, DELETE } from "@/app/api/settings/avatar/route";
import { authenticatedClient } from "@/features/projects/server/service";
import { RequestError } from "@/lib/request-security";
const request = (method:string, body:BodyInit, type="image/webp", owner=user.id, origin="https://vircuit.test") => new Request("https://vircuit.test/api/settings/avatar", {method,headers:{Origin:origin,"Content-Type":type,"x-vircuit-owner":owner},body});
beforeEach(()=>{ vi.clearAllMocks(); client.storage.from.mockReturnValue(storage); });
it("rejects cross-origin, account-switch, unsupported and oversized uploads before storage writes",async()=>{
  expect((await POST(request("POST","file","image/webp",user.id,"https://evil.test"))).status).toBe(403);
  expect((await POST(request("POST","file","image/svg+xml"))).status).toBe(415);
  expect((await POST(request("POST","file","image/webp","other"))).status).toBe(409);
  expect((await POST(request("POST",new Uint8Array(512*1024+1)))).status).toBe(413);
  expect(storage.upload).not.toHaveBeenCalled();
});
it("downloads only authenticated owner's photo, never public data, with no-store/nosniff",async()=>{
  storage.download.mockResolvedValue({data:new Blob(["test-image"],{type:"image/webp"}),error:null});
  const result=await GET(); expect(result.status).toBe(200);
  expect(storage.download).toHaveBeenCalledWith(`${user.id}/avatar.webp`, { cacheNonce: expect.any(String) });
  expect(result.headers.get("cache-control")).toBe("private, no-store");
  expect(result.headers.get("x-content-type-options")).toBe("nosniff");
  vi.mocked(authenticatedClient).mockRejectedValueOnce(new RequestError("Masuk kembali.",401));
  expect((await GET()).status).toBe(401);
});
it("does not accept a delete path or fabricate a successful removal",async()=>{
  expect((await DELETE(request("DELETE",JSON.stringify({path:"other/avatar.webp"}),"application/json"))).status).toBe(400);
  expect(storage.remove).not.toHaveBeenCalled();
  storage.remove.mockResolvedValueOnce({error:{message:"internal-secret"}}).mockResolvedValueOnce({error:null});
  const failed=await DELETE(request("DELETE","{}","application/json")); expect(failed.status).toBe(503); expect(await failed.text()).not.toContain("internal-secret");
  expect((await DELETE(request("DELETE","{}","application/json"))).status).toBe(200);
  expect(storage.remove).toHaveBeenCalledWith([`${user.id}/avatar.webp`]);
});
