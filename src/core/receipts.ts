import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadConfig } from "./config.js";

/**
 * Append-only receipts log. Every money-moving leg BillLeash performs (an FX
 * swap, an x402 payment, a card checkout) is recorded here with its tx hash so
 * the dashboard and the submission can show a verifiable trail. The file is
 * local state (receipts.json, git-ignored) — the on-chain tx is the real proof.
 */
export interface Receipt {
  id: string;
  kind: "convert" | "payment" | "register" | "leash";
  tsIso: string;
  /** Human summary. */
  summary: string;
  txHash?: `0x${string}`;
  explorer?: string;
  /** ERC-8021 tag carried by the tx. */
  tagged?: boolean;
  from?: { amount: string; symbol: string };
  to?: { amount: string; symbol: string };
  usd?: string;
  rail?: string;
  /** Anything extra worth keeping (raw order id, status, etc.). */
  meta?: Record<string, unknown>;
}

const FILE = "receipts.json";

export function loadReceipts(): Receipt[] {
  if (!existsSync(FILE)) return [];
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Receipt[];
  } catch {
    return [];
  }
}

export function recordReceipt(r: Receipt): Receipt {
  const all = loadReceipts();
  all.unshift(r);
  writeFileSync(FILE, JSON.stringify(all, null, 2));
  return r;
}

export function explorerTx(hash: string): string {
  return `${loadConfig().network.explorer}/tx/${hash}`;
}
