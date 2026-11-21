import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Bill } from "./types.js";
import type { Session } from "@altananetwork/sdk";
import { payX402 } from "./altana.js";

const run = promisify(execFile);

export interface PayResult {
  rail: Bill["rail"];
  ok: boolean;
  /** Tx hash / receipt id / run-report id, whichever the rail returns. */
  ref?: string;
  detail: string;
}

/**
 * Pay a bill on the rail it declares. All on-chain legs come from the leashed
 * Altana session, so the spend cap / allowlist / expiry still bind. A hard
 * `maxUsd` guard is applied on top (defence in depth) before any spend.
 */
export async function payBill(
  bill: Bill,
  opts: { session?: Session; maxUsd: number },
): Promise<PayResult> {
  if (Number(bill.usdAmount) > opts.maxUsd)
    return { rail: bill.rail, ok: false, detail: `blocked: $${bill.usdAmount} over hard max $${opts.maxUsd}` };

  switch (bill.rail) {
    case "x402": {
      if (!opts.session) return { rail: "x402", ok: false, detail: "no leashed session provided" };
      const res = await payX402(opts.session, bill.target);
      return { rail: "x402", ok: res.ok, ref: res.headers.get("x-payment-response") ?? undefined, detail: `x402 ${res.status}` };
    }
    case "buy":
      return payWithBuy(bill, opts.maxUsd);
    case "agentvault-card":
      // Card checkout drives Agent Vault's proxied browser with mock tokens.
      // Needs an Agent Vault account + API key (env), so it runs where the
      // agent runs. Implemented in scripts/pay-card.ts against @agentvault/*.
      return { rail: "agentvault-card", ok: false, detail: "agent-vault card leg runs via scripts/pay-card.ts (needs AV account)" };
  }
}

/**
 * Pay a metered endpoint through Celo's `buy` x402 client. `buy` holds the key
 * in the OS keychain and refuses to sign above --max-amount. Sandbox mode runs
 * the whole flow on Celo Sepolia with a faucet (no real funds).
 */
export async function payWithBuy(bill: Bill, maxUsd: number, sandbox = false): Promise<PayResult> {
  const args = ["--yes", "@celo/buy@0.8.6"];
  if (sandbox) args.push("--sandbox");
  args.push("curl", "--max-amount", maxUsd.toString(), bill.target);
  try {
    const { stdout } = await run("npx", args, { timeout: 120_000, env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
    return { rail: "buy", ok: true, detail: stdout.slice(0, 500) };
  } catch (e: any) {
    return { rail: "buy", ok: false, detail: String(e.stderr ?? e.message).slice(0, 500) };
  }
}
