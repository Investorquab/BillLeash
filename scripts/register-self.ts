/**
 * Register a Self Agent ID (human-backed, proof-of-personhood) on Celo mainnet,
 * wrapping @selfxyz/agent-sdk. → Track 3 / identity.
 *
 * The SCAN IS A USER STEP: a human opens the deep link / QR in the Self app and
 * scans their passport once. This script starts the session, shows the link, and
 * waits for completion to capture the on-chain agentId.
 *
 *   npx tsx scripts/register-self.ts [--mode wallet-free|linked] [--export-key]
 *
 * Env:
 *   SELF_MODE            registration mode (default "wallet-free")
 *   SELF_NETWORK         "mainnet" (default) | "testnet"
 *   SELF_HUMAN_ADDRESS   required for linked/privy/smartwallet modes
 *   SELF_MIN_AGE         minimum age to disclose (default 18)
 *
 * The Self mainnet registry (0xaC3D…5944) matches config/event.json. Modes that
 * generate an agent key can export it with --export-key (written to the
 * git-ignored self-agent-key.json; treat as a secret). No funds move here.
 */
import "../src/core/env.js";
import { writeFileSync } from "node:fs";
import { requestRegistration, type RegistrationMode } from "@selfxyz/agent-sdk";
import { loadConfig } from "../src/core/config.js";

const mode = (process.env.SELF_MODE ?? argValue("mode") ?? "wallet-free") as RegistrationMode;
const network = (process.env.SELF_NETWORK ?? "mainnet") as "mainnet" | "testnet";
const minimumAge = Number(process.env.SELF_MIN_AGE ?? "18");
const exportKey = process.argv.includes("--export-key");
const humanAddress = process.env.SELF_HUMAN_ADDRESS;

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const linkedModes = new Set(["linked", "ed25519-linked", "privy", "smartwallet"]);
if (linkedModes.has(mode) && !humanAddress)
  throw new Error(`mode "${mode}" requires SELF_HUMAN_ADDRESS (the human's wallet address).`);

const cfg = loadConfig();
console.log(`Self Agent ID registration · mode=${mode} · network=${network}`);
console.log(`Registry: ${cfg.contracts.selfAgentIdRegistry}\n`);

const session = await requestRegistration({
  mode,
  network,
  disclosures: { minimumAge, ofac: true },
  ...(humanAddress ? { humanAddress } : {}),
});

console.log("── Scan this with the Self app (passport) — this is the user step ──");
console.log(`  Deep link: ${session.deepLink}`);
console.log(`  QR (PNG):  ${session.scanUrl}`);
console.log(`  Agent address: ${session.agentAddress}`);
for (const line of session.humanInstructions ?? []) console.log(`  • ${line}`);
console.log(`\nWaiting for the scan to complete (session expires ${session.expiresAt})…`);

const result = await session.waitForCompletion();
console.log(`\n✓ Registered. Self agentId: ${result.agentId}`);
console.log(`  agent address: ${result.agentAddress}`);

const out = {
  agentId: result.agentId,
  agentAddress: result.agentAddress,
  network,
  mode,
  registry: cfg.contracts.selfAgentIdRegistry,
  registeredAt: new Date().toISOString(),
  credentials: result.credentials ?? null,
};
writeFileSync("self-agent.json", JSON.stringify(out, null, 2));
console.log("  Saved to self-agent.json.");

if (exportKey) {
  try {
    const key = await session.exportKey();
    writeFileSync("self-agent-key.json", JSON.stringify({ agentId: result.agentId, privateKey: key }, null, 2));
    console.log("  ⚠ Exported the agent key to self-agent-key.json (git-ignored, SECRET).");
  } catch (e) {
    console.log(`  (exportKey not available for mode "${mode}": ${(e as Error).message})`);
  }
}

console.log(`\nAdd Self agentId ${result.agentId} to config/event.json and the dashboard seed for the submission.`);
