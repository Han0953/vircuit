import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  jar: { getAll: vi.fn(() => []), set: vi.fn() },
  factory: vi.fn((_url: string, _key: string, options: { cookies: { setAll: (values: { name: string; value: string; options: object }[]) => void } }) => options),
}));
vi.mock("next/headers", () => ({ cookies: async () => mocks.jar }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.factory }));
vi.mock("@/lib/supabase/env", () => ({ supabaseEnv: () => ({ url: "https://provider.example.test", key: "publishable-test" }) }));
import { serverClient } from "@/lib/supabase/server";

describe("server cookie boundary", () => {
  it("does not mutate cookies during a Server Component render", async () => {
    await serverClient(true);
    mocks.factory.mock.calls.at(-1)![2].cookies.setAll([{ name: "session", value: "fixture", options: {} }]);
    expect(mocks.jar.set).not.toHaveBeenCalled();
  });
  it("allows cookie writes in Route Handlers", async () => {
    await serverClient();
    mocks.factory.mock.calls.at(-1)![2].cookies.setAll([{ name: "session", value: "fixture", options: {} }]);
    expect(mocks.jar.set).toHaveBeenCalledWith("session", "fixture", {});
  });
});
