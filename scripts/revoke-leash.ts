/**
 * Revoke the agent's leash in one transaction — the money-shot. After it
 * confirms, the session key's next action reverts at validation on-chain.
 *
 *   ALTANA_ADMIN_KEY=0x... tsx scripts/revoke-leash.ts
 */
import "../src/core/env.js";
import {
  createClient,
  CELO,
  signerFromPrivateKey,
  deserializeSession,
} from "@altananetwork/sdk";
import { readFileSync } from "node:fs";

const adminKey = process.env.ALTANA_ADMIN_KEY as `0x${string}` | undefined;
if (!adminKey) throw new Error("ALTANA_ADMIN_KEY is not set (the user's wallet key).");

const stored = JSON.parse(readFileSync("session.json", "utf8")) as {
  wallet: string;
  sessionPrivateKey: `0x${string}`;
  serialized: Parameters<typeof deserializeSession>[0];
};

const client = createClient({ chains: [CELO] });
const signer = signerFromPrivateKey(adminKey);
const wallet = await client.createWallet({ signer });
const session = deserializeSession(stored.serialized, signerFromPrivateKey(stored.sessionPrivateKey));

console.log("Revoking the session everywhere…");
const result = await client.revokeSession({ wallet, signer, session });
console.log("\n✓ Revoked.");
console.log(JSON.stringify(result, null, 2));
console.log("  Capture the revoke tx hash for the submission (Altana track).");
