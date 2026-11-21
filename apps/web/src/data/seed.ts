import { CONTRACTS, TOKENS, ERC8004, ATTRIBUTION_TAG } from "./config";

/**
 * Pre-seeded demo state for the public dashboard. Two kinds of data live here:
 *
 *  • REAL, verifiable on-chain facts — the ERC-8004 registration (its tx hash
 *    was read back from Celo mainnet and its ERC-8021 tag decoded). These carry
 *    a real Celoscan link and a "confirmed" status.
 *
 *  • Clearly-labelled DEMO history — illustrative bill/convert events that show
 *    the agent's flow. These are badged "demo" and never fabricate a tx hash or
 *    a Celoscan link, so nothing here can be mistaken for a real receipt.
 *
 * Judges open the page with no sign-in; this is what they see before touching a
 * button. Live reads (identity ownerOf, Textile FX rates) are layered on top at
 * runtime with graceful fallback, so the demo never depends on a live call.
 */

export type FeedStatus = "confirmed" | "demo" | "pending" | "refused";
export type FeedKind = "identity" | "leash" | "convert" | "payment" | "revoke";

export interface FeedEvent {
  id: string;
  kind: FeedKind;
  status: FeedStatus;
  title: string;
  detail: string;
  /** Local currency leg, when relevant. */
  from?: { amount: string; symbol: string };
  /** Dollar leg, when relevant. */
  to?: { amount: string; symbol: string };
  usd?: string;
  vendor?: string;
  rail?: "x402" | "buy" | "agent-vault";
  /** Real tx hash (confirmed events only). */
  txHash?: `0x${string}`;
  /** Whether this tx carried the ERC-8021 attribution tag. */
  tagged?: boolean;
  tsIso: string;
}

/** The leash the owner grants the agent — mirrors DEMO_LEASH in the engine. */
export interface LeashState {
  capUsd: string;
  period: "day" | "week" | "month";
  spentUsd: string;
  /** Unix seconds. */
  expiry: number;
  allowlist: { label: string; address: `0x${string}`; kind: string }[];
  /** Altana smart-agent wallet address (owner-controlled). */
  walletAddress?: `0x${string}`;
  status: "active" | "revoked" | "ungranted";
}

const now = Math.floor(Date.now() / 1000);

export const SEED_LEASH: LeashState = {
  capUsd: "20.00",
  period: "month",
  spentUsd: "12.41",
  expiry: now + 7 * 86400, // 7-day TTL from load (demo)
  status: "active",
  allowlist: [
    { label: "Textile FX reactor", address: CONTRACTS.textileFxReactor, kind: "FX swap" },
    { label: "Textile order executor", address: CONTRACTS.textileVaultOrderExecutor, kind: "FX settle" },
    { label: "Permit2", address: CONTRACTS.permit2, kind: "approval" },
    { label: "USD₮", address: TOKENS.USDT.address, kind: "stablecoin" },
    { label: "USDC", address: TOKENS.USDC.address, kind: "stablecoin" },
    { label: "cNGN", address: TOKENS.cNGN.address, kind: "stablecoin" },
  ],
};

export const SEED_FEED: FeedEvent[] = [
  {
    id: "reg-8004",
    kind: "identity",
    status: "confirmed",
    title: `ERC-8004 identity minted · agentId ${ERC8004.agentId}`,
    detail: `register() → identity NFT to the agent wallet, calldata tagged ${ATTRIBUTION_TAG}`,
    txHash: ERC8004.registerTx,
    tagged: true,
    tsIso: ERC8004.registeredAtIso,
  },
  {
    id: "demo-pay-vps",
    kind: "payment",
    status: "demo",
    title: "Paid VPS invoice (metered API · x402)",
    detail: "Decision gate ✓ cap, allowlist, expiry → x402 settlement from the session key",
    vendor: "Hetzner-style VPS",
    rail: "x402",
    from: { amount: "9,020", symbol: "cNGN" },
    to: { amount: "6.00", symbol: "USD₮" },
    usd: "6.00",
    tagged: true,
    tsIso: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "demo-convert",
    kind: "convert",
    status: "demo",
    title: "Converted naira → USD₮ (Textile FX)",
    detail: "Firm RFQ quote → swap broadcast to the reactor with the attribution tag",
    from: { amount: "50,000", symbol: "cNGN" },
    to: { amount: "34.62", symbol: "USD₮" },
    tagged: true,
    tsIso: new Date(Date.now() - 6 * 3600_000).toISOString(),
  },
  {
    id: "demo-pay-ai",
    kind: "payment",
    status: "demo",
    title: "Paid transcription API (per-call · x402)",
    detail: "Small metered call settled under the cap — agent never held the dollars longer than the swap",
    vendor: "Whisper-style API",
    rail: "x402",
    from: { amount: "6,440", symbol: "cNGN" },
    to: { amount: "4.41", symbol: "USD₮" },
    usd: "4.41",
    tagged: true,
    tsIso: new Date(Date.now() - 9 * 3600_000).toISOString(),
  },
  {
    id: "demo-refused",
    kind: "payment",
    status: "refused",
    title: "Refused: $45 SaaS renewal — over remaining cap",
    detail: "Rules in code decide money, not a model. A refusal always wins.",
    vendor: "SaaS subscription",
    usd: "45.00",
    tsIso: new Date(Date.now() - 11 * 3600_000).toISOString(),
  },
  {
    id: "grant-leash",
    kind: "leash",
    status: "demo",
    title: "Leash granted · $20 USD₮ / month, 7-day expiry",
    detail: "Altana session key scoped to a spend cap + contract allowlist, enforced on-chain",
    tsIso: new Date(Date.now() - 12 * 3600_000).toISOString(),
  },
];

/**
 * Last-verified Textile FX previews (read live from Celo mainnet on build day).
 * Used as the fallback when a browser can't reach the Textile API directly
 * (CORS) — the UI labels these "cached" and lets the viewer refresh.
 */
export interface RateSeed {
  symbol: string;
  /** How many local units buy 1 USD₮ (indicative, from a real preview). */
  perUsd: string;
  /** USD₮ out for a sample sell amount. */
  sample: { sell: string; out: string };
}

export const SEED_RATES: RateSeed[] = [
  { symbol: "cNGN", perUsd: "1,444", sample: { sell: "50,000", out: "34.62" } },
  { symbol: "IDRX", perUsd: "15,850", sample: { sell: "500,000", out: "31.54" } },
  { symbol: "wARS", perUsd: "1,015", sample: { sell: "40,000", out: "39.40" } },
  { symbol: "wCOP", perUsd: "3,910", sample: { sell: "150,000", out: "38.36" } },
];

export const RATES_VERIFIED_ISO = "2026-11-21T04:00:00Z";
