import {
  createClient,
  CELO,
  signerFromPrivateKey,
  createPrivateKeySigner,
  type Session,
} from "@altananetwork/sdk";
import { loadConfig, token } from "./config.js";

/**
 * The leash: a non-custodial Altana smart-agentic wallet on Celo. The owner
 * (admin key / passkey) grants the agent a SESSION key scoped to a spend cap,
 * a contract allowlist, and an expiry — all enforced on-chain by the wallet,
 * not by our code — and can revoke it in one transaction.
 *
 * Admin actions (createWallet, grantSession) need the owner's key, so they run
 * where that key lives (the owner's machine / the VPS), never in a shared
 * session. Verification is a plain read and runs anywhere.
 */
export function leashClient() {
  return createClient({ chains: [CELO] });
}

export interface GrantLeashInput {
  /** Owner admin key — supplied via env where the agent runs; never committed. */
  adminPrivateKey: `0x${string}`;
  /** Vendor/contract addresses the session may call (Textile reactor, tokens, PayTo…). */
  allowlist: `0x${string}`[];
  /** Spend-cap token symbol (e.g. "USDT") and human cap per period. */
  capToken: string;
  capAmount: string;
  period: "day" | "week" | "month";
  /** Session lifetime in seconds from now. */
  ttlSec: number;
}

/** Create (or reuse) the agent's wallet and grant it a scoped session. Admin-only. */
export async function grantLeash(input: GrantLeashInput): Promise<Session> {
  const client = leashClient();
  const signer = signerFromPrivateKey(input.adminPrivateKey);
  const wallet = await client.createWallet({ signer });
  const cap = token(input.capToken);
  const { toBaseUnits } = await import("./amounts.js");
  return client.grantSession({
    wallet,
    signer,
    sessionSigner: createPrivateKeySigner(),
    permissions: {
      calls: input.allowlist.map((to) => ({ to })),
      spend: [
        {
          token: cap.address,
          limit: toBaseUnits(input.capAmount, cap.decimals),
          period: input.period,
        },
      ],
    },
    expiry: Math.floor(Date.now() / 1000) + input.ttlSec,
  } as Parameters<typeof client.grantSession>[0]);
}

/** Pay a metered x402 endpoint from the session key (capped, revocable). */
export async function payX402(session: Session, url: string): Promise<Response> {
  return leashClient().fetchWithX402({ session, url });
}

/** Revoke the session everywhere in one transaction. Admin-only. */
export async function revokeLeash(session: Session): Promise<unknown> {
  return leashClient().revokeSession({ session } as never);
}

/** Read-only: does `keyHash` still hold authority on `wallet`? Plain eth_call. */
export async function verifyAuthority(
  wallet: `0x${string}`,
  keyHash: `0x${string}`,
): Promise<boolean> {
  const { accountHasKey } = await import("@altananetwork/sdk");
  const { createPublicClient, http } = await import("viem");
  const pc = createPublicClient({ transport: http(loadConfig().network.rpc) });
  return accountHasKey(pc as never, wallet, keyHash);
}

export const KEYSTORE_ADDRESS = "0x83b30935f36d6ccf9B1ec3b5E47F2866b97cd27c" as const;
