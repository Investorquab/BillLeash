import { describe, it, expect } from "vitest";
import { toBaseUnits, fromBaseUnits, effectiveRate } from "../src/core/amounts.js";
import { canPay } from "../src/core/decision.js";
import { tagSuffix, tagCalldata, readTag } from "../src/core/tag.js";
import type { Bill, Leash } from "../src/core/types.js";

describe("amounts (decimal-aware)", () => {
  it("parses by token decimals", () => {
    expect(toBaseUnits("50000", 6)).toBe(50_000_000_000n); // cNGN 6dp
    expect(toBaseUnits("5000", 2)).toBe(500_000n); // IDRX 2dp
    expect(toBaseUnits("1.5", 18)).toBe(1_500_000_000_000_000_000n); // wARS 18dp
  });
  it("rejects over-precise amounts", () => {
    expect(() => toBaseUnits("1.234", 2)).toThrow();
  });
  it("round-trips", () => {
    expect(fromBaseUnits(toBaseUnits("34.58", 6), 6)).toBe("34.58");
  });
  it("computes an effective rate", () => {
    // 50000 cNGN -> 34.58 USDT
    expect(effectiveRate(50_000_000_000n, 6, 34_580_000n, 6)).toBeCloseTo(0.0006916, 6);
  });
});

describe("attribution tag", () => {
  it("builds a suffix and appends it", () => {
    const suffix = tagSuffix();
    expect(suffix.startsWith("0x")).toBe(true);
    const tagged = tagCalldata("0xabcdef");
    expect(tagged.startsWith("0xabcdef")).toBe(true);
    expect(tagged.length).toBeGreaterThan("0xabcdef".length);
  });
  it("reads a tag back from tagged calldata", () => {
    const tagged = tagCalldata("0x");
    expect(readTag(tagged)).not.toBeNull();
  });
});

describe("payment decision (rules in code, refusal wins)", () => {
  const leash: Leash = {
    capUsd: "50",
    period: "day",
    allowlist: ["0x1111111111111111111111111111111111111111"],
    expiry: 2_000_000_000,
    spentUsd: "40",
  };
  const bill = (over: Partial<Bill>): Bill => ({
    id: "b1", vendor: "VPS", rail: "x402", usdAmount: "6", target: "https://x", ...over,
  });

  it("allows a bill within cap and allowlist", () => {
    expect(canPay(bill({ payTo: "0x1111111111111111111111111111111111111111" }), leash, 1_700_000_000).ok).toBe(true);
  });
  it("refuses over the remaining cap", () => {
    const d = canPay(bill({ usdAmount: "20" }), leash, 1_700_000_000);
    expect(d.ok).toBe(false);
  });
  it("refuses a non-allowlisted vendor", () => {
    const d = canPay(bill({ payTo: "0x2222222222222222222222222222222222222222" }), leash, 1_700_000_000);
    expect(d).toEqual({ ok: false, reason: expect.stringContaining("allowlist") });
  });
  it("refuses after expiry", () => {
    expect(canPay(bill({}), leash, 2_000_000_001).ok).toBe(false);
  });
});
