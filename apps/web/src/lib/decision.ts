import type { LeashState } from "../data/seed";

/**
 * The money gate, ported from src/core/decision.ts. Rules in code decide whether
 * a payment may proceed — never a model — and a refusal always wins. The same
 * limits are enforced on-chain by the Altana session; this mirror gives the UI a
 * clear, instant reason and demonstrates the policy to judges.
 */
export interface BillInput {
  usdAmount: number;
  vendor: string;
  /** Optional on-chain payee that must be on the allowlist. */
  payTo?: `0x${string}`;
}

export type Decision = { ok: true } | { ok: false; reason: string };

export function canPay(bill: BillInput, leash: LeashState, nowSec = Math.floor(Date.now() / 1000)): Decision {
  if (leash.status === "revoked") return { ok: false, reason: "leash revoked — the agent can no longer spend" };
  if (leash.status === "ungranted") return { ok: false, reason: "no leash granted yet" };
  if (!(bill.usdAmount > 0)) return { ok: false, reason: `bill amount must be positive` };
  if (nowSec >= leash.expiry) return { ok: false, reason: "leash expired" };

  const remaining = Number(leash.capUsd) - Number(leash.spentUsd);
  if (bill.usdAmount > remaining)
    return { ok: false, reason: `over cap: $${bill.usdAmount.toFixed(2)} > $${remaining.toFixed(2)} remaining this ${leash.period}` };

  if (bill.payTo) {
    const allowed = leash.allowlist.map((a) => a.address.toLowerCase());
    if (!allowed.includes(bill.payTo.toLowerCase()))
      return { ok: false, reason: `vendor ${bill.payTo} not on the allowlist` };
  }
  return { ok: true };
}

export function remainingUsd(leash: LeashState): number {
  return Math.max(0, Number(leash.capUsd) - Number(leash.spentUsd));
}
