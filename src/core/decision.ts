import type { Bill, Leash, Decision } from "./types.js";

/**
 * The money gate. Rules in code decide whether a payment may proceed — a model
 * never does, and a refusal always wins. These mirror the Altana session limits
 * (which also enforce them on-chain); checking here first gives a clear reason
 * and avoids a wasted, reverting transaction.
 */
export function canPay(bill: Bill, leash: Leash, nowSec: number): Decision {
  const amount = Number(bill.usdAmount);
  if (!(amount > 0)) return { ok: false, reason: `bill amount must be positive (${bill.usdAmount})` };

  if (nowSec >= leash.expiry)
    return { ok: false, reason: `leash expired at ${new Date(leash.expiry * 1000).toISOString()}` };

  const remaining = Number(leash.capUsd) - Number(leash.spentUsd);
  if (amount > remaining)
    return {
      ok: false,
      reason: `over cap: bill $${amount} > $${remaining.toFixed(2)} remaining this ${leash.period}`,
    };

  // On-chain payments must go to an allow-listed address.
  if (bill.payTo) {
    const allowed = leash.allowlist.map((a) => a.toLowerCase());
    if (!allowed.includes(bill.payTo.toLowerCase()))
      return { ok: false, reason: `vendor ${bill.payTo} not on the allowlist` };
  }

  return { ok: true };
}
