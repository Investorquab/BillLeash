export type Rail = "x402" | "buy" | "agentvault-card";

/** A dollar-denominated bill the agent may pay. */
export interface Bill {
  id: string;
  vendor: string;
  /** How it is paid: metered API (x402/buy) or a card subscription (Agent Vault). */
  rail: Rail;
  /** USD amount due (human string, e.g. "6.00"). */
  usdAmount: string;
  /** For x402/buy: the endpoint. For agentvault-card: the checkout URL. */
  target: string;
  /** The vendor's receiving address (x402 PayTo) if paid on-chain. */
  payTo?: `0x${string}`;
  dueDate?: string;
}

/** The on-chain leash the owner grants the agent (mirrors Altana session). */
export interface Leash {
  /** Spend cap per period, USD. */
  capUsd: string;
  period: "day" | "week" | "month";
  /** Contract/vendor addresses the agent may call/pay. */
  allowlist: `0x${string}`[];
  /** Unix seconds. */
  expiry: number;
  /** USD already spent this period. */
  spentUsd: string;
}

export interface Quote {
  status: string;
  sellToken: `0x${string}`;
  buyToken: `0x${string}`;
  sellAmount: string;
  buyAmount: string;
  /** Taker fee, denominated in the SELL token's base units (~2 bps on Celo). */
  feeAmount: string;
  availableSellAmount: string;
  rateRay?: string;
}

export type Decision =
  | { ok: true }
  | { ok: false; reason: string };
