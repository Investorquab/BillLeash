import { createPublicClient, http, parseAbi } from "viem";
import { celo } from "viem/chains";
import { CHAIN, CONTRACTS, AGENT_WALLET, ERC8004 } from "../data/config";

/**
 * Read-only chain access for the dashboard. Every call here is a plain eth_call
 * against Celo mainnet — no keys, no spend — so it is safe to run in any
 * viewer's browser. Results are used to *confirm* the pre-seeded facts live;
 * if the RPC is unreachable the UI keeps the verified seed values.
 */
export function publicClient() {
  return createPublicClient({ chain: celo, transport: http(CHAIN.rpc) });
}

const IDENTITY_ABI = parseAbi([
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
]);

export interface IdentityLive {
  ok: boolean;
  owner?: string;
  ownerMatches?: boolean;
  tokenUri?: string;
  error?: string;
}

/** Confirm the ERC-8004 identity NFT (agentId 10082) is owned by the agent wallet. */
export async function readIdentity(): Promise<IdentityLive> {
  try {
    const pc = publicClient();
    const [owner, tokenUri] = await Promise.all([
      pc.readContract({
        address: CONTRACTS.erc8004Identity,
        abi: IDENTITY_ABI,
        functionName: "ownerOf",
        args: [BigInt(ERC8004.agentId)],
      }),
      pc.readContract({
        address: CONTRACTS.erc8004Identity,
        abi: IDENTITY_ABI,
        functionName: "tokenURI",
        args: [BigInt(ERC8004.agentId)],
      }),
    ]);
    return {
      ok: true,
      owner,
      ownerMatches: owner.toLowerCase() === AGENT_WALLET.toLowerCase(),
      tokenUri,
    };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Current mainnet block — a small "we really are on-chain" liveness proof. */
export async function readBlock(): Promise<bigint | null> {
  try {
    return await publicClient().getBlockNumber();
  } catch {
    return null;
  }
}
