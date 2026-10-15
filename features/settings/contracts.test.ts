import { describe, expect, it } from "vitest";
import { accountActionSchema, defaultPreferences, preferencesSchema, profileSchema, safeProfileName, accountInformation } from "./contracts";
import type { User } from "@supabase/supabase-js";

describe("settings validation and identity", () => {
  it("trims names and rejects markup, control chars, missing and excessive names", () => {
    expect(profileSchema.parse({ displayName: "  Nadia Putri  " }).displayName).toBe("Nadia Putri");
    for (const displayName of ["", "a", "x".repeat(101), "<script>", "A\nB", "A\u202eB"]) expect(profileSchema.safeParse({ displayName }).success).toBe(false);
    expect(profileSchema.safeParse({ displayName: "Nadia", id: "other-owner" }).success).toBe(false);
  });
  it("never uses a full email as the greeting and safely falls back", () => {
    expect(safeProfileName("Nadia", { full_name: "Old Name" })).toBe("Nadia");
    expect(safeProfileName("", { full_name: "Google Name" })).toBe("Google Name");
    expect(safeProfileName("person@example.test", { name: "person@example.test" })).toBe("Pengguna Vircuit");
  });
  it("validates strict preferences and password confirmation", () => {
    expect(preferencesSchema.parse(defaultPreferences)).toEqual(defaultPreferences);
    expect(preferencesSchema.safeParse({ ...defaultPreferences, motion: "invalid" }).success).toBe(false);
    expect(accountActionSchema.safeParse({ action: "password", values: { currentPassword: "old", password: "new-password", confirmation: "different", nonce: "" } }).success).toBe(false);
    expect(accountActionSchema.safeParse({ action: "email", email: "invalid" }).success).toBe(false);
    expect(accountActionSchema.safeParse({ action: "email", email: "a@example.test", userId: "forged" }).success).toBe(false);
  });
  it("uses actual identities rather than assuming an OAuth password", () => {
    const user = { identities: [{ provider: "google" }], email: "a@example.test", created_at: "2026-01-01", email_confirmed_at: undefined } as User;
    expect(accountInformation(user)).toMatchObject({ providers: ["google"], hasPassword: false, verified: false });
  });
});
