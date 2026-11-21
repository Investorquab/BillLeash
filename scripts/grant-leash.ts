/**
 * Grant the agent a leash (Altana session key) on Celo mainnet — the user's
 * action. The admin signer is the USER's wallet (ALTANA_ADMIN_KEY); it authorises
 * a session key scoped to a spend cap, a contract allowlist, and an expiry.
 *
 * The session's PRIVATE key is generated here and saved (with the serialized
 * public half) to session.json — git-ignored, treat as a secret. In production
 * this lives in a per-user secret store, not a file.
 *
 *   ALTANA_ADMIN_KEY=0x... tsx scripts/grant-leash.ts
 *
 * Needs a little CELO on the admin wallet for the Keystore registration.
 */
import "../src/core/env.js";
import {
  createClient,
  CELO,
  signerFromPrivateKey,
  serializeSession,
} from "@altananetwork/sdk";
import { generatePrivateKey } from "viem/accounts";
import { writeFileSync } from "node:fs";
import { token } from "../src/core/config.js";
import { toBaseUnits } from "../src/core/amounts.js";
import { defaultAllowlist, DEMO_LEASH } from "../src/core/leash-config.js";

const adminKey = process.env.ALTANA_ADMIN_KEY as `0x${string}` | undefined;
if (!adminKey) throw new Error("ALTANA_ADMIN_KEY is not set (the user's wallet key).");

const p = DEMO_LEASH;
const cap = token(p.capToken);
const allowlist = defaultAllowlist();
const expiry = Math.floor(Date.now() / 1000) + p.ttlDays * 86400;

const client = createClient({ chains: [CELO] });
const signer = signerFromPrivateKey(adminKey);

console.log("Creating / loading the user's Altana wallet…");
const wallet = await client.createWallet({ signer });
console.log("  wallet:", wallet.address);

const sessionPrivateKey = generatePrivateKey();
const sessionSigner = signerFromPrivateKey(sessionPrivateKey);

console.log(`Granting session: cap ${p.capAmount} ${p.capToken}/${p.period}, expiry ${new Date(expiry * 1000).toISOString()}`);
console.log("  allowlist:", allowlist.join(", "));

const session = await client.grantSession({
  wallet,
  signer,
  sessionSigner,
  permissions: {
    calls: allowlist.map((to) => ({ to })),
    spend: [{ token: cap.address, limit: toBaseUnits(p.capAmount, cap.decimals), period: p.period }],
  },
  expiry,
} as Parameters<typeof client.grantSession>[0]);

writeFileSync(
  "session.json",
  JSON.stringify({ wallet: wallet.address, sessionPrivateKey, serialized: serializeSession(session) }, null, 2),
);
console.log("\n✓ Leash granted. Session saved to session.json (git-ignored, contains a secret key).");
console.log("  Capture the grant tx hash from the Altana Keystore explorer for the submission.");
console.log("  Revoke anytime: tsx scripts/revoke-leash.ts");
