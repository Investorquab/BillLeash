import { loadConfig } from "./config.js";

/**
 * The leash a user grants the agent. For the demo, the allowlist is the exact
 * set of contracts the agent may touch to pay bills: the Textile FX reactor
 * (to swap local stablecoin → USD₮), the stablecoins themselves (ERC-20
 * approve/transfer), and any vendor PayTo addresses. Nothing else can be called.
 */
export function defaultAllowlist(extraVendors: `0x${string}`[] = []): `0x${string}`[] {
  const c = loadConfig();
  return [
    c.contracts.textileFxReactor,
    c.contracts.textileVaultOrderExecutor,
    c.contracts.permit2,
    c.tokens.USDT.address,
    c.tokens.USDC.address,
    c.tokens.cNGN.address,
    ...extraVendors,
  ];
}

export interface LeashParams {
  capToken: string; // e.g. "USDT"
  capAmount: string; // e.g. "20"
  period: "day" | "week" | "month";
  ttlDays: number;
  extraVendors?: `0x${string}`[];
}

export const DEMO_LEASH: LeashParams = {
  capToken: "USDT",
  capAmount: "20",
  period: "month",
  ttlDays: 7,
};
