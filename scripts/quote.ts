/**
 * Live Textile FX quote (read-only, no key, no spend) against Celo mainnet.
 * Usage: NODE_USE_ENV_PROXY=1 tsx scripts/quote.ts <sell> <buy> <amount>
 * e.g.   tsx scripts/quote.ts cNGN USDT 50000
 */
import { TextileFx } from "../src/core/textile.js";
import { fromBaseUnits, effectiveRate } from "../src/core/amounts.js";
import { token } from "../src/core/config.js";

const [sell = "cNGN", buy = "USDT", amount = "50000"] = process.argv.slice(2);

const fx = new TextileFx();
const q = await fx.preview(sell, buy, amount);
const s = token(sell);
const b = token(buy);

const out = fromBaseUnits(q.buyAmount, b.decimals);
const fee = fromBaseUnits(q.feeAmount, s.decimals); // fee is denominated in the SELL token
const rate = effectiveRate(BigInt(q.sellAmount), s.decimals, BigInt(q.buyAmount), b.decimals);

console.log(`${amount} ${sell} -> ${out} ${buy}`);
console.log(`  fee: ${fee} ${sell} | effective: 1 ${sell} = ${rate.toPrecision(6)} ${buy}`);
console.log(`  available liquidity: ${fromBaseUnits(q.availableSellAmount, s.decimals)} ${sell}`);
