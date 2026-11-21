import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { loadConfig } from "./config.js";

/**
 * viem clients for the agent. The private key comes from AGENT_PRIVATE_KEY in
 * the environment where the agent runs — never from this repo. The public
 * client needs no key and works anywhere.
 */
export function publicClient() {
  return createPublicClient({ chain: celo, transport: http(loadConfig().network.rpc) });
}

export function agentAccount() {
  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk) throw new Error("AGENT_PRIVATE_KEY is not set (put it in .env where the agent runs).");
  return privateKeyToAccount(pk as `0x${string}`);
}

export function walletClient() {
  return createWalletClient({
    account: agentAccount(),
    chain: celo,
    transport: http(loadConfig().network.rpc),
  });
}
