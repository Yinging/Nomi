import { describe, expect, it } from "vitest";
import { COST_TABLE, estimateCost, formatCost } from "./providerCostTable";

describe("providerCostTable", () => {
  it("returns null for unknown kind", () => {
    expect(estimateCost({ provider: "*", model: "gpt-4o", kind: "unknown" })).toBeNull();
  });

  it("estimates GPT-4o by tokens", () => {
    const cost = estimateCost({ provider: "chatfire", model: "gpt-4o", kind: "text", tokens: 2000 });
    expect(cost).toBeCloseTo(0.005 * 2, 4); // $0.005 / 1k * 2k tokens
  });

  it("estimates GPT-4o with default token usage when tokens omitted", () => {
    const cost = estimateCost({ provider: "chatfire", model: "gpt-4o", kind: "text" });
    expect(cost).toBeGreaterThan(0);
  });

  it("estimates flat per-call for flux", () => {
    expect(estimateCost({ provider: "chatfire", model: "flux-1-pro", kind: "image" })).toBeCloseTo(0.055);
  });

  it("estimates per-second for kling", () => {
    expect(estimateCost({ provider: "chatfire", model: "kling-1.5", kind: "video", durationSec: 10 }))
      .toBeCloseTo(5.0);
  });

  it("estimates per-second with 5s fallback when duration omitted", () => {
    expect(estimateCost({ provider: "chatfire", model: "kling-1.5", kind: "video" }))
      .toBeCloseTo(2.5);
  });

  it("returns null when no model pattern matches", () => {
    expect(estimateCost({ provider: "x", model: "unknown-model-xyz", kind: "image" })).toBeNull();
  });

  it("table covers text/image/video kinds", () => {
    const kinds = new Set(COST_TABLE.map((e) => e.kind));
    expect(kinds.has("text")).toBe(true);
    expect(kinds.has("image")).toBe(true);
    expect(kinds.has("video")).toBe(true);
  });

  describe("formatCost", () => {
    it("formats sub-cent as <$0.01", () => {
      expect(formatCost(0.001)).toBe("<$0.01");
    });
    it("formats sub-dollar with 3 decimals", () => {
      expect(formatCost(0.345)).toBe("$0.345");
    });
    it("formats normal values with 2 decimals", () => {
      expect(formatCost(12.5)).toBe("$12.50");
    });
    it("rounds large values", () => {
      expect(formatCost(150.7)).toBe("$151");
    });
  });
});
