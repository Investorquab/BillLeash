import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface TokenInfo {
  address: `0x${string}`;
  decimals: number;
}

export interface EventConfig {
  event: string;
  deadlineUtc: string;
  /** The loops attribution tag that must be appended to every counted transaction. */
  attributionTag: string;
  /** The single agent wallet registered with loops; score is tied to it. */
  agentWallet: string;
  network: { name: string; chainId: number; rpc: string; explorer: string };
  contracts: Record<string, `0x${string}`>;
  x402Facilitator: string;
  textileRfqApi: string;
  tokens: Record<string, TokenInfo>;
  corridorsLeadWith: string;
}

let cached: EventConfig | null = null;

export function loadConfig(): EventConfig {
  if (cached) return cached;
  const path = join(__dirname, "../../config/event.json");
  cached = JSON.parse(readFileSync(path, "utf8")) as EventConfig;
  return cached;
}

/** Resolve a token by symbol (case-insensitive). Throws if unknown. */
export function token(symbol: string): TokenInfo & { symbol: string } {
  const cfg = loadConfig();
  const key = Object.keys(cfg.tokens).find(
    (k) => k.toLowerCase() === symbol.toLowerCase(),
  );
  if (!key) throw new Error(`Unknown token "${symbol}". Known: ${Object.keys(cfg.tokens).join(", ")}`);
  return { symbol: key, ...cfg.tokens[key] };
}

/** True when the agent wallet has been registered (not the placeholder). */
export function agentWalletReady(): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(loadConfig().agentWallet);
}
