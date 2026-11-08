import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";

describe("password hashing", () => {
  it("creates a salted hash and verifies the original password", async () => {
    const hash = await hashPassword("CareWell@123");
    expect(hash).toContain(":");
    expect(hash).not.toContain("CareWell@123");
    expect(await verifyPassword("CareWell@123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("CareWell@123");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("uses a different salt for every hash", async () => {
    const first = await hashPassword("CareWell@123");
    const second = await hashPassword("CareWell@123");
    expect(first).not.toBe(second);
  });

  it("returns false for malformed stored values", async () => {
    expect(await verifyPassword("anything", "broken-hash")).toBe(false);
  });
});
