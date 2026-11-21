/**
 * Decimal-aware amount helpers. Token decimals on Celo vary (cNGN 6, IDRX 2,
 * wARS 18, USD₮ 6), so never hardcode 1e18 — always pass the token's decimals.
 */

/** Parse a human amount ("50000", "1.5") into base units for a token's decimals. */
export function toBaseUnits(human: string | number, decimals: number): bigint {
  const s = typeof human === "number" ? human.toString() : human.trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error(`Invalid amount: ${human}`);
  const [whole, frac = ""] = s.split(".");
  if (frac.length > decimals)
    throw new Error(`Amount ${human} has more than ${decimals} decimal places`);
  const padded = frac.padEnd(decimals, "0");
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

/** Format base units back to a human string with the token's decimals. */
export function fromBaseUnits(base: bigint | string, decimals: number): string {
  const b = typeof base === "string" ? BigInt(base) : base;
  const neg = b < 0n;
  const abs = neg ? -b : b;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const frac = (abs % divisor).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole}${frac ? "." + frac : ""}`;
}

/** Effective price = buy per 1 sell, as a Number for display only. */
export function effectiveRate(
  sellBase: bigint,
  sellDecimals: number,
  buyBase: bigint,
  buyDecimals: number,
): number {
  const sell = Number(fromBaseUnits(sellBase, sellDecimals));
  const buy = Number(fromBaseUnits(buyBase, buyDecimals));
  return sell === 0 ? 0 : buy / sell;
}
