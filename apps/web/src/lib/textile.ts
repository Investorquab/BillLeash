import { CHAIN, TOKENS } from "../data/config";
import { SEED_RATES, RATES_VERIFIED_ISO } from "../data/seed";

/**
 * Browser Textile FX client. Mirrors src/core/textile.ts `preview` (public,
 * no key, no spend) but runs client-side. Direct calls to api.textilecredit.com
 * can be blocked by CORS on a static host; we attempt a live preview and, on
 * any failure, fall back to the last-verified rate seed. The UI shows which.
 *
 * In dev, vite proxies /textile → api.textilecredit.com (see vite.config.ts) so
 * live previews work locally.
 */

const TEXTILE_DIRECT = "https://api.textilecredit.com";
const TEXTILE_PROXY = "/textile"; // dev proxy path

function toBaseUnits(human: string, decimals: number): string {
  const s = human.replace(/,/g, "").trim();
  const [whole, frac = ""] = s.split(".");
  const padded = frac.slice(0, decimals).padEnd(decimals, "0");
  return (BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(padded || "0")).toString();
}

function fromBaseUnits(base: string, decimals: number): number {
  const b = BigInt(base);
  return Number(b) / 10 ** decimals;
}

export interface PreviewResult {
  live: boolean;
  sell: string;
  buy: string;
  sellSymbol: string;
  buySymbol: string;
  outUsd: number;
  /** local units per 1 USD₮ */
  perUsd: number;
  verifiedIso?: string;
}

async function tryPreview(base: string, sell: string, buy: string, amount: string): Promise<number | null> {
  const s = TOKENS[sell];
  const b = TOKENS[buy];
  if (!s || !b) return null;
  try {
    const res = await fetch(`${base}/v2/rfq/preview`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chainId: CHAIN.chainId,
        sellToken: s.address,
        buyToken: b.address,
        sellAmount: toBaseUnits(amount, s.decimals),
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.data ?? json;
    if (!d?.buyAmount) return null;
    return fromBaseUnits(String(d.buyAmount), b.decimals);
  } catch {
    return null;
  }
}

/** Live preview of `amount` local → USD₮, with cached fallback. */
export async function previewToUsd(sellSymbol: string, amount: string): Promise<PreviewResult> {
  const buy = "USDT";
  // Try dev proxy first (works locally), then direct (works where CORS allows).
  let out = await tryPreview(TEXTILE_PROXY, sellSymbol, buy, amount);
  if (out == null) out = await tryPreview(TEXTILE_DIRECT, sellSymbol, buy, amount);

  const amt = Number(amount.replace(/,/g, ""));
  if (out != null && amt > 0) {
    return {
      live: true,
      sell: amount,
      buy: buy,
      sellSymbol,
      buySymbol: "USD₮",
      outUsd: out,
      perUsd: amt / out,
    };
  }

  // Fallback: derive from the verified seed.
  const seed = SEED_RATES.find((r) => r.symbol === sellSymbol);
  const perUsd = seed ? Number(seed.perUsd.replace(/,/g, "")) : 0;
  return {
    live: false,
    sell: amount,
    buy,
    sellSymbol,
    buySymbol: "USD₮",
    outUsd: perUsd > 0 ? amt / perUsd : 0,
    perUsd,
    verifiedIso: RATES_VERIFIED_ISO,
  };
}

/** The headline rate table (a few corridors), live where possible. */
export async function loadRateTable(): Promise<
  { symbol: string; perUsd: number; live: boolean; sample: { sell: string; out: number } }[]
> {
  const out = await Promise.all(
    SEED_RATES.map(async (r) => {
      const p = await previewToUsd(r.symbol, r.sample.sell);
      return {
        symbol: r.symbol,
        perUsd: p.perUsd,
        live: p.live,
        sample: { sell: r.sample.sell, out: p.outUsd },
      };
    }),
  );
  return out;
}
