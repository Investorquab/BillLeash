/**
 * Convert a local-currency stablecoin → USD₮ on Textile FX (Celo mainnet) and
 * broadcast the swap from the registered agent wallet, with the ERC-8021
 * attribution tag appended to every transaction. → Track 1 (Stablecoin Corridors).
 *
 * Flow (see src/core/convert.ts):
 *   1. preview            — public price (no key), logged for sanity.
 *   2. request firm quote — POST /v2/rfq/request, authenticated with
 *                           TEXTILE_API_KEY (the key is linked to the taker
 *                           wallet at creation; that is the API's proof of
 *                           control). taker = the agent wallet.
 *   3. broadcast          — sign & send the returned transaction(s) to the
 *                           Textile reactor, appending the attribution tag via
 *                           viem `dataSuffix`. Wait for each receipt; record it.
 *
 * Run where the key lives (never in a shared/CI session):
 *   NODE_USE_ENV_PROXY=1 \
 *   TEXTILE_API_KEY=tx_... AGENT_PRIVATE_KEY=0x... \
 *   npx tsx scripts/convert.ts cNGN USDT 50000 [--dry]
 *
 * --dry stops after the firm quote (no broadcast) — useful to inspect the exact
 * response shape the first time you run with a real key.
 *
 * This moves real funds on mainnet; coordinated with the key-holder.
 */
import "../src/core/env.js";
import { convert } from "../src/core/convert.js";
import { recordReceipt, explorerTx } from "../src/core/receipts.js";

const [sell = "cNGN", buy = "USDT", amount = "50000", ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");

const apiKey = process.env.TEXTILE_API_KEY;
if (!apiKey) throw new Error("TEXTILE_API_KEY is not set (create a key in the Textile app; it links your taker wallet).");

const result = await convert({ sell, buy, amount, apiKey, dry, log: (l) => console.log(l) });

if (dry) {
  console.log("\n--dry: stopped before broadcast. No funds moved.");
  process.exit(0);
}

recordReceipt({
  id: `convert-${Date.now()}`,
  kind: "convert",
  tsIso: new Date().toISOString(),
  summary: `Converted ${amount} ${sell} → ~${result.previewOut} ${buy} on Textile FX`,
  txHash: result.swapTx,
  explorer: result.swapTx ? explorerTx(result.swapTx) : undefined,
  tagged: true,
  from: { amount, symbol: sell },
  to: { amount: result.previewOut, symbol: buy },
  meta: { steps: result.steps, rate: result.rate, txHashes: result.txHashes },
});

console.log(`\n✓ Convert complete. Swap tx: ${result.swapTx}`);
console.log(`  Recorded to receipts.json. Capture ${result.swapTx} to private/evidence/onchain.md (Track 1).`);
