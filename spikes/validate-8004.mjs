import { ERC8004_ABI, identityRegistry, AGENT_URI, isRegistered } from "../src/core/erc8004.ts";
import { tagSuffix } from "../src/core/tag.ts";
import { publicClient } from "../src/core/wallet.ts";
import { loadConfig } from "../src/core/config.ts";
const cfg = loadConfig();
const w = cfg.agentWallet;
console.log("agent wallet:", w);
console.log("already registered?", await isRegistered(w));
// simulate the register call AS the agent wallet (no key, no spend)
try {
  const { request } = await publicClient().simulateContract({
    account: w, address: identityRegistry(), abi: ERC8004_ABI,
    functionName: "register", args: [AGENT_URI, []], dataSuffix: tagSuffix(),
  });
  console.log("simulate register: OK (call is valid, would mint)");
} catch (e) {
  console.log("simulate register FAILED:", String(e.shortMessage||e.message).split("\n")[0]);
}
