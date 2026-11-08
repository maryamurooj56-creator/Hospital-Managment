import { describe, expect, it } from "vitest";
import { initials, roleHome, safeNextPath, statusBadge } from "../src/lib/format";

describe("formatting and route helpers", () => {
  it("maps roles to their dashboards", () => {
    expect(roleHome("admin")).toBe("/admin");
    expect(roleHome("doctor")).toBe("/doctor");
    expect(roleHome("patient")).toBe("/patient");
  });

  it("only allows safe local redirect paths", () => {
    expect(safeNextPath("/book")).toBe("/book");
    expect(safeNextPath("//evil.example")).toBe("/patient");
    expect(safeNextPath("https://evil.example")).toBe("/patient");
    expect(safeNextPath(undefined, "/book")).toBe("/book");
  });

  it("builds initials and status classes", () => {
    expect(initials("Dr. Amelia Hart")).toBe("DA");
    expect(statusBadge("confirmed")).toContain("badge-green");
    expect(statusBadge("cancelled")).toContain("badge-red");
  });
});
