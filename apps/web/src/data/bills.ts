/**
 * Demo bills shown in the dashboard. Mirror of /config/bills.json (the bills the
 * agent actually pays via scripts/pay-bill.ts) — keep the two in sync. The last
 * entry is a dashboard-only over-cap bill, to demonstrate the refusal gate.
 */
export interface DemoBill {
  id: string;
  vendor: string;
  usd: number;
  rail: "x402" | "buy" | "agent-vault";
  fund: string;
}

export const BILLS: DemoBill[] = [
  { id: "vps-metered", vendor: "Metered VPS API (x402)", usd: 6.0, rail: "x402", fund: "cNGN" },
  { id: "transcribe-metered", vendor: "Transcription API (x402)", usd: 4.41, rail: "x402", fund: "cNGN" },
  { id: "saas-card", vendor: "SaaS subscription (Agent Vault)", usd: 12.0, rail: "agent-vault", fund: "cNGN" },
  { id: "saas-overcap", vendor: "SaaS renewal — over cap", usd: 45.0, rail: "x402", fund: "cNGN" },
];
