import os from "node:os";
import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: { getPath: () => os.tmpdir(), getAppPath: () => process.cwd() },
}));

import { normalizeProjectRecord, sanitizeName } from "./repository";

describe("sanitizeName", () => {
  it("replaces filesystem-unsafe characters with underscore", () => {
    expect(sanitizeName('a/b:c*d?e"f')).toBe("a_b_c_d_e_f");
    expect(sanitizeName("a\\b|c<d>e")).toBe("a_b_c_d_e");
  });
  it("collapses whitespace and trims", () => {
    expect(sanitizeName("  hello   world  ")).toBe("hello world");
  });
  it("falls back when empty/blank", () => {
    expect(sanitizeName("")).toBe("Untitled");
    expect(sanitizeName("   ")).toBe("Untitled");
    expect(sanitizeName("", "Project")).toBe("Project");
  });
  it("caps length at 90 chars", () => {
    expect(sanitizeName("x".repeat(200)).length).toBe(90);
  });
});

describe("normalizeProjectRecord", () => {
  it("throws on non-object input", () => {
    expect(() => normalizeProjectRecord(null)).toThrow();
    expect(() => normalizeProjectRecord([])).toThrow();
    expect(() => normalizeProjectRecord("x")).toThrow();
  });
  it("fills defaults and sanitizes the name", () => {
    const rec = normalizeProjectRecord({ name: "My/Film" });
    expect(rec.id).toMatch(/^project-/);
    expect(rec.name).toBe("My_Film");
    expect(rec.revision).toBe(0);
    expect(rec.version).toBe(1);
    expect(typeof rec.createdAt).toBe("number");
    expect(typeof rec.updatedAt).toBe("number");
    expect(typeof rec.savedAt).toBe("number");
  });
  it("preserves a provided id and numeric timestamps", () => {
    const rec = normalizeProjectRecord({ id: " p1 ", name: "n", createdAt: 100, updatedAt: 200, revision: 5, version: 3 });
    expect(rec.id).toBe("p1");
    expect(rec.createdAt).toBe(100);
    expect(rec.updatedAt).toBe(200);
    expect(rec.revision).toBe(5);
    expect(rec.version).toBe(3);
  });
});
