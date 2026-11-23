/**
 * Readiness check — read-only. One command to see what is left before a live run.
 * Makes only eth_calls and a public Textile preview: no keys, no spend, no tx.
 *
 *   NODE_USE_ENV_PROXY=1 npx tsx scripts/doctor.ts
 *
 * Checks the agent wallet's CELO (gas) and cNGN (funding) balances, whether the
 * Textile API key is set and its preview works, and that the ERC-8004 identity is
 * registered. Prints a PASS / MISSING checklist and exits non-zero if anything a
 * live convert → pay needs is missing.
 */
import "../src/core/env.js";
import { parseAbi, formatEther } from "viem";
import { loadConfig, token } from "../src/core/config.js";
import { publicClient } from "../src/core/wallet.js";
import { isRegistered } from "../src/core/erc8004.js";
import { TextileFx } from "../src/core/textile.js";
import { fromBaseUnits } from "../src/core/amounts.js";

const cfg = loadConfig();
const wallet = cfg.agentWallet as `0x${string}`;
const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)"]);

type Row = { ok: boolean; label: string; detail: string; needed: boolean };
const rows: Row[] = [];
const add = (ok: boolean, label: string, detail: string, needed = true) => rows.push({ ok, label, detail, needed });

console.log(`BillLeash readiness — agent wallet ${wallet} on ${cfg.network.name}\n`);
const pc = publicClient();

// CELO for gas
try {
  const bal = await pc.getBalance({ address: wallet });
  const celo = Number(formatEther(bal));
  add(celo > 0.01, "CELO for gas", `${celo.toFixed(4)} CELO`);
} catch (e) {
  add(false, "CELO for gas", `read failed: ${(e as Error).message.slice(0, 60)}`);
}

// cNGN funding balance
try {
  const cngn = token("cNGN");
  const bal = await pc.readContract({ address: cngn.address, abi: erc20, functionName: "balanceOf", args: [wallet] });
  const human = fromBaseUnits(bal, cngn.decimals);
  add(bal > 0n, "cNGN to convert", `${human} cNGN`, false);
} catch (e) {
  add(false, "cNGN to convert", `read failed: ${(e as Error).message.slice(0, 60)}`, false);
}

// ERC-8004 identity
try {
  add(await isRegistered(wallet), "ERC-8004 identity", `agentId expected (registry ${cfg.contracts.erc8004Identity.slice(0, 10)}…)`);
} catch (e) {
  add(false, "ERC-8004 identity", `read failed: ${(e as Error).message.slice(0, 60)}`);
}

// Textile API key
const hasKey = !!process.env.TEXTILE_API_KEY;
add(hasKey, "TEXTILE_API_KEY set", hasKey ? "present in env" : "missing (needed for the firm quote)");

// Textile preview (public, no key)
try {
  const q = await new TextileFx().preview("cNGN", "USDT", "50000");
  const out = fromBaseUnits(q.buyAmount, token("USDT").decimals);
  add(Number(out) > 0, "Textile FX preview", `50,000 cNGN → ${out} USD₮`);
} catch (e) {
  add(false, "Textile FX preview", `failed: ${(e as Error).message.slice(0, 60)}`);
}

// AGENT_PRIVATE_KEY (only to broadcast; not needed for reads/dry)
const hasPk = !!process.env.AGENT_PRIVATE_KEY;
add(hasPk, "AGENT_PRIVATE_KEY set", hasPk ? "present (can broadcast)" : "missing (needed only to send txs)", false);

// ---- print ---------------------------------------------------------------
console.log("Checklist:");
for (const r of rows) {
  const mark = r.ok ? "✓ PASS " : r.needed ? "✗ MISSING" : "· todo  ";
  console.log(`  ${mark}  ${r.label.padEnd(22)} ${r.detail}`);
}
const missingNeeded = rows.filter((r) => !r.ok && r.needed);
const cngnOk = rows.find((r) => r.label === "cNGN to convert")?.ok ?? false;
if (missingNeeded.length > 0) {
  console.log(`\n✗ Not ready: ${missingNeeded.length} required check(s) missing above.`);
  process.exit(1);
} else if (!cngnOk) {
  console.log("\n⚠ Required checks pass, but the wallet holds 0 cNGN — a convert run has nothing to swap. Fund cNGN, then re-run.");
  process.exit(1);
} else {
  console.log("\n✓ Ready for a live convert → pay.");
  process.exit(0);
}
