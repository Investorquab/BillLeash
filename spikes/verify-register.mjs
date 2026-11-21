import { createPublicClient, http, parseAbi, decodeEventLog } from "viem";
import { celo } from "viem/chains";
import { fromDataSuffix } from "@celo/attribution-tags";
import { isRegistered, identityRegistry } from "../src/core/erc8004.ts";
import { loadConfig } from "../src/core/config.ts";
const cfg = loadConfig();
const pc = createPublicClient({ chain: celo, transport: http(cfg.network.rpc) });
const hash = "0x1e36ad61bff6a88db99e06a36017e3ce0bcda3f3c7f563e789d3b50ecbba60bf";

console.log("registered now?", await isRegistered(cfg.agentWallet));

const tx = await pc.getTransaction({ hash });
const tag = fromDataSuffix(tx.input);
console.log("tag in calldata:", tag);

const rcpt = await pc.getTransactionReceipt({ hash });
const erc721 = parseAbi(["event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"]);
let agentId = null;
for (const log of rcpt.logs) {
  if (log.address.toLowerCase() !== identityRegistry().toLowerCase()) continue;
  try { const d = decodeEventLog({ abi: erc721, data: log.data, topics: log.topics });
    if (d.eventName === "Transfer") agentId = d.args.tokenId.toString();
  } catch {}
}
console.log("ERC-8004 agentId:", agentId);
console.log("gas used:", rcpt.gasUsed.toString(), "| status:", rcpt.status);
