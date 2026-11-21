import { parseAbi } from "viem";
import { loadConfig } from "./config.js";
import { publicClient } from "./wallet.js";

/** ERC-8004 Identity Registry: register(agentURI, metadata[]) mints to msg.sender. */
export const ERC8004_ABI = parseAbi([
  "function register(string agentURI, (string metadataKey, bytes metadataValue)[] metadata) returns (uint256 agentId)",
  "function setAgentURI(uint256 agentId, string newURI)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
]);

export function identityRegistry(): `0x${string}` {
  return loadConfig().contracts.erc8004Identity;
}

/** The hosted agent identity record the registration points to. */
export const AGENT_URI =
  "https://raw.githubusercontent.com/Investorquab/BillLeash/main/agent.json";

/** Read-only: how many ERC-8004 identity NFTs the agent wallet holds (0 = not registered). */
export async function isRegistered(wallet: `0x${string}`): Promise<boolean> {
  const n = await publicClient().readContract({
    address: identityRegistry(),
    abi: ERC8004_ABI,
    functionName: "balanceOf",
    args: [wallet],
  });
  return n > 0n;
}
