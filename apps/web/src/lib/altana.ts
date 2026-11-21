import { DEMO_LEASH_PARAMS } from "./leash";

/**
 * Connect-wallet → grant-leash → revoke flow for the dashboard.
 *
 * In production this drives the Altana browser SDK: the owner authenticates with
 * a passkey (no seed phrase, no private key ever leaves their device), and the
 * agent is granted a session key scoped to a spend cap + contract allowlist +
 * expiry — all enforced on-chain by the Altana smart-agent wallet. Revoke kills
 * the session in one transaction (the money-shot).
 *
 * Those admin actions require the owner's signer, which exists only on the
 * owner's device (or the operator VPS running scripts/grant-leash.ts &
 * scripts/revoke-leash.ts). This public, no-sign-in dashboard therefore presents
 * the flow truthfully as a DEMO: it detects passkey capability and explains what
 * happens on a real device, but never holds or requests a private key, and no
 * funds move from this page.
 */

export type ConnectMode = "live" | "demo";

export interface ConnectResult {
  mode: ConnectMode;
  walletAddress: `0x${string}`;
  note: string;
}

export interface GrantResult {
  mode: ConnectMode;
  note: string;
}

// A deterministic demo wallet address (illustrative only — clearly not a key).
const DEMO_WALLET = "0xA11ce0DE000000000000000000000000000Lea5h" as `0x${string}`;

function passkeyCapable(): boolean {
  return typeof window !== "undefined" && "PublicKeyCredential" in window;
}

/** Begin the owner passkey connect (demo on the public page). */
export async function connectWallet(): Promise<ConnectResult> {
  const capable = passkeyCapable();
  return {
    mode: "demo",
    walletAddress: DEMO_WALLET,
    note: capable
      ? "Demo connect. On your own device this is an Altana passkey — no seed phrase, no private key leaves the device."
      : "Demo connect (this browser has no passkey support). On a passkey device the owner authenticates the Altana wallet directly.",
  };
}

/** Grant the agent a scoped session (the leash). */
export async function grantLeash(): Promise<GrantResult> {
  return {
    mode: "demo",
    note: `Grant: ${DEMO_LEASH_PARAMS.capAmount} ${DEMO_LEASH_PARAMS.capToken}/${DEMO_LEASH_PARAMS.period}, ${DEMO_LEASH_PARAMS.ttlDays}-day expiry, ${DEMO_LEASH_PARAMS.allowlistCount} contracts allow-listed — the real on-chain grant runs from the owner's passkey (scripts/grant-leash.ts).`,
  };
}

/** Revoke the session — kills the agent's spending authority in one tx. */
export async function revokeLeash(): Promise<GrantResult> {
  return {
    mode: "demo",
    note: "The real revoke is one on-chain tx from the owner's passkey (scripts/revoke-leash.ts); after it confirms, the session key's next action reverts at on-chain validation.",
  };
}
