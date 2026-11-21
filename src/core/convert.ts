import { getAddress, type Hex } from "viem";
import { TextileFx } from "./textile.js";
import { token, loadConfig } from "./config.js";
import { fromBaseUnits, effectiveRate } from "./amounts.js";
import { tagCalldata } from "./tag.js";
import { walletClient, publicClient, agentAccount } from "./wallet.js";

/**
 * Textile FX convert, as a reusable unit: preview → firm quote → broadcast the
 * returned transaction(s) with the ERC-8021 attribution tag appended. Used by
 * both scripts/convert.ts (standalone) and scripts/pay-bill.ts (as the funding
 * leg). Celo mainnet only. Moves real funds — run only where the key lives.
 */

export interface TxStep {
  to: `0x${string}`;
  data: Hex;
  value?: bigint;
}

export interface ConvertResult {
  previewOut: string;
  rate: number;
  steps: number;
  txHashes: `0x${string}`[];
  swapTx?: `0x${string}`;
}

function asHex(v: unknown): Hex | undefined {
  return typeof v === "string" && v.startsWith("0x") ? (v as Hex) : undefined;
}

function oneStep(o: any): TxStep | null {
  if (!o || typeof o !== "object") return null;
  const to = asHex(o.to ?? o.target ?? o.address);
  const data = asHex(o.data ?? o.calldata ?? o.input);
  if (!to || !data) return null;
  const rawVal = o.value ?? o.wei;
  return { to: getAddress(to), data, value: rawVal != null ? BigInt(rawVal) : undefined };
}

/**
 * Pull the broadcastable transaction(s) out of a firm-quote response. The RFQ
 * reactor flow may return a single executable tx or a short sequence (e.g. a
 * Permit2/approve step then settle). Supports both and several field spellings;
 * returns [] if none match (the caller decides what to do, and prints the raw
 * payload) — never guesses.
 */
export function extractSteps(resp: any): TxStep[] {
  const root = resp?.data ?? resp;
  const list = [root?.transactions, root?.txs, root?.steps, root?.order?.transactions].find(
    (x) => Array.isArray(x) && x.length,
  );
  if (list) return (list as any[]).map(oneStep).filter(Boolean) as TxStep[];
  const single = oneStep(root?.transaction ?? root?.tx ?? root?.order?.transaction ?? root);
  return single ? [single] : [];
}

export interface ConvertOpts {
  sell: string;
  buy?: string;
  amount: string;
  apiKey: string;
  /** Stop before broadcasting (inspect the response). */
  dry?: boolean;
  /** Called with human-readable progress lines. */
  log?: (line: string) => void;
}

export async function convert(opts: ConvertOpts): Promise<ConvertResult> {
  const log = opts.log ?? (() => {});
  const buy = opts.buy ?? "USDT";
  const cfg = loadConfig();
  const s = token(opts.sell);
  const b = token(buy);

  const fx = new TextileFx();
  const pq = await fx.preview(opts.sell, buy, opts.amount);
  const previewOut = fromBaseUnits(pq.buyAmount, b.decimals);
  const rate = effectiveRate(BigInt(pq.sellAmount), s.decimals, BigInt(pq.buyAmount), b.decimals);
  log(`Preview: ${opts.amount} ${opts.sell} → ${previewOut} ${buy} (1 ${opts.sell} = ${rate.toPrecision(6)} ${buy})`);

  const account = agentAccount();
  const taker = getAddress(account.address);
  const firm = await fx.request(opts.sell, buy, opts.amount, opts.apiKey, taker);
  log("Firm quote response:\n" + JSON.stringify(firm, null, 2));

  const steps = extractSteps(firm);
  if (!steps.length) {
    throw new Error(
      `No broadcastable transaction in the firm-quote response. The reactor ${cfg.contracts.textileFxReactor} ` +
        "may require Permit2 + reactor.execute encoding — settle with the order fields shown, or extend extractSteps().",
    );
  }
  log(`Parsed ${steps.length} transaction step(s); tag appended to each.`);

  if (opts.dry) {
    return { previewOut, rate, steps: steps.length, txHashes: [] };
  }

  const wallet = walletClient();
  const pc = publicClient();
  const txHashes: `0x${string}`[] = [];
  for (const [i, step] of steps.entries()) {
    const hash = await wallet.sendTransaction({
      to: step.to,
      data: tagCalldata(step.data),
      value: step.value ?? 0n,
    });
    log(`[step ${i + 1}/${steps.length}] ${step.to} → ${hash}`);
    const rcpt = await pc.waitForTransactionReceipt({ hash });
    if (rcpt.status !== "success") throw new Error(`convert step ${i + 1} reverted (${hash})`);
    txHashes.push(hash);
  }

  return { previewOut, rate, steps: steps.length, txHashes, swapTx: txHashes[txHashes.length - 1] };
}
