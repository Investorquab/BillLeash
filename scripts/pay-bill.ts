/**
 * Pay a dollar bill end-to-end — the orchestrator. → Track 2 (Agent Vault / pay).
 *
 *   decision gate  →  convert (if funding ≠ USD)  →  pay (x402 / buy / AV)  →  receipt
 *
 * Rules in code decide whether money moves; a refusal always wins. The same
 * limits are enforced on-chain by the Altana session, so this gate just gives a
 * fast, clear reason and avoids a wasted, reverting tx. Every broadcast leg
 * carries the ERC-8021 attribution tag.
 *
 * Run where the keys live (never in a shared/CI session):
 *   NODE_USE_ENV_PROXY=1 \
 *   AGENT_PRIVATE_KEY=0x... [TEXTILE_API_KEY=tx_...] \
 *   npx tsx scripts/pay-bill.ts \
 *     --vendor "VPS" --usd 6 --rail x402 --target https://vps.example/meter \
 *     [--payTo 0x..] [--fund cNGN] [--dry]
 *
 * --dry runs the gate + a convert PREVIEW and stops before any broadcast.
 * Moves real funds on mainnet otherwise; coordinated with the key-holder.
 */
import "../src/core/env.js";
import { existsSync, readFileSync } from "node:fs";
import type { Bill, Leash, Rail } from "../src/core/types.js";
import { loadConfig, token } from "../src/core/config.js";
import { canPay } from "../src/core/decision.js";
import { defaultAllowlist, DEMO_LEASH } from "../src/core/leash-config.js";
import { TextileFx } from "../src/core/textile.js";
import { convert } from "../src/core/convert.js";
import { effectiveRate, fromBaseUnits } from "../src/core/amounts.js";
import { payBill } from "../src/core/payrouter.js";
import { recordReceipt, loadReceipts, explorerTx } from "../src/core/receipts.js";

// ---- args ----------------------------------------------------------------
function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

const vendor = arg("vendor", "VPS hosting");
const usdAmount = arg("usd", "6")!;
const rail = (arg("rail", "x402") as Rail);
const target = arg("target", "https://example.com/meter")!;
const payTo = arg("payTo") as `0x${string}` | undefined;
const fund = arg("fund", loadConfig().corridorsLeadWith)!; // e.g. cNGN
const DRY = hasFlag("dry");

const USD_STABLES = new Set(["USDT", "USDC", "USAT"]);
const cfg = loadConfig();

const bill: Bill = { id: `bill-${Date.now()}`, vendor: vendor!, rail, usdAmount, target, payTo };

// ---- build the leash state for the gate ----------------------------------
// spent-this-period is derived from recorded payment receipts (honest running
// total); the cap/allowlist/expiry mirror the granted Altana session.
const spentUsd = loadReceipts()
  .filter((r) => r.kind === "payment" && r.usd)
  .reduce((sum, r) => sum + Number(r.usd), 0)
  .toFixed(2);

const leash: Leash = {
  capUsd: DEMO_LEASH.capAmount,
  period: DEMO_LEASH.period,
  allowlist: defaultAllowlist(payTo ? [payTo] : []),
  expiry: Math.floor(Date.now() / 1000) + DEMO_LEASH.ttlDays * 86400,
  spentUsd,
};

// ---- 1. decision gate (refusal wins) -------------------------------------
const decision = canPay(bill, leash, Math.floor(Date.now() / 1000));
console.log(`Bill: ${bill.vendor} — $${bill.usdAmount} via ${bill.rail} → ${bill.target}`);
console.log(`Leash: $${leash.capUsd}/${leash.period}, $${leash.spentUsd} spent, funding in ${fund}`);
if (!decision.ok) {
  console.error(`\n⛔ Refused: ${decision.reason}`);
  console.error("   Rules in code decided this — no model, no override. Nothing moved.");
  process.exit(1);
}
console.log("✓ Decision gate: within cap, allowlist & expiry.");

// ---- 2. convert funding → USD₮ (if needed) -------------------------------
let fundingTx: `0x${string}` | undefined;
if (!USD_STABLES.has(fund.toUpperCase())) {
  const s = token(fund);
  // Size the sell leg from a live preview rate, + a 2% buffer for fee/slippage.
  const fx = new TextileFx();
  const probe = await fx.preview(fund, "USDT", "1000");
  const perUsd = 1 / effectiveRate(BigInt(probe.sellAmount), s.decimals, BigInt(probe.buyAmount), token("USDT").decimals);
  const sellHuman = (Number(usdAmount) * perUsd * 1.02).toFixed(Math.min(s.decimals, 6));
  console.log(`\nConvert leg: ~${sellHuman} ${fund} → $${usdAmount} USD₮ (rate 1 USD₮ ≈ ${perUsd.toFixed(2)} ${fund}, +2% buffer)`);

  const apiKey = process.env.TEXTILE_API_KEY;
  if (DRY) {
    console.log("  --dry: convert preview only (no firm quote, no broadcast).");
  } else if (!apiKey) {
    throw new Error("TEXTILE_API_KEY is not set — needed to convert the funding currency before paying.");
  } else {
    const c = await convert({ sell: fund, amount: sellHuman, apiKey, log: (l) => console.log("  " + l) });
    fundingTx = c.swapTx;
    recordReceipt({
      id: `convert-${Date.now()}`,
      kind: "convert",
      tsIso: new Date().toISOString(),
      summary: `Funded $${usdAmount} bill: ${sellHuman} ${fund} → ~${c.previewOut} USD₮`,
      txHash: c.swapTx,
      explorer: c.swapTx ? explorerTx(c.swapTx) : undefined,
      tagged: true,
      from: { amount: sellHuman, symbol: fund },
      to: { amount: c.previewOut, symbol: "USDT" },
      meta: { forBill: bill.id },
    });
  }
} else {
  console.log(`\nFunding already in a dollar stable (${fund}) — no conversion needed.`);
}

if (DRY) {
  console.log("\n--dry: stopping before payment. No funds moved.");
  process.exit(0);
}

// ---- 3. pay on the declared rail -----------------------------------------
// x402 pays from the leashed Altana session (session.json); buy/AV per payrouter.
let session: unknown | undefined;
if (bill.rail === "x402" && existsSync("session.json")) {
  const { deserializeSession, signerFromPrivateKey } = await import("@altananetwork/sdk");
  const stored = JSON.parse(readFileSync("session.json", "utf8"));
  session = deserializeSession(stored.serialized, signerFromPrivateKey(stored.sessionPrivateKey));
}

console.log(`\nPaying via ${bill.rail}…`);
const result = await payBill(bill, { session: session as never, maxUsd: Number(leash.capUsd) });
console.log(`  ${result.ok ? "✓" : "✗"} ${result.detail}${result.ref ? ` (ref: ${result.ref})` : ""}`);

// ---- 4. record the payment receipt ---------------------------------------
recordReceipt({
  id: bill.id,
  kind: "payment",
  tsIso: new Date().toISOString(),
  summary: `Paid ${bill.vendor} $${bill.usdAmount} via ${bill.rail}`,
  txHash: (result.ref && result.ref.startsWith("0x") ? (result.ref as `0x${string}`) : fundingTx),
  tagged: true,
  usd: bill.usdAmount,
  rail: bill.rail,
  from: fund !== "USDT" ? { amount: "(converted)", symbol: fund } : undefined,
  to: { amount: bill.usdAmount, symbol: "USDT" },
  meta: { ok: result.ok, detail: result.detail, fundingTx },
});

console.log(`\n${result.ok ? "✓ Bill paid" : "✗ Payment failed"} — recorded to receipts.json.`);
process.exit(result.ok ? 0 : 1);
