/**
 * Register the agent on ERC-8004 (Celo mainnet), with the loops attribution tag
 * appended — so this single transaction satisfies BOTH on-chain checks:
 *   • "tag seen on-chain"  (the tx carries celo_f5886810da35)
 *   • "ERC-8004 identity"  (the agent wallet now holds its identity NFT)
 *
 * Run where the key lives:
 *   AGENT_PRIVATE_KEY=0x... tsx scripts/register-8004.ts
 * The wallet needs a little CELO for gas.
 */
import { ERC8004_ABI, identityRegistry, AGENT_URI, isRegistered } from "../src/core/erc8004.js";
import { tagSuffix } from "../src/core/tag.js";
import { walletClient, publicClient, agentAccount } from "../src/core/wallet.js";
import { loadConfig } from "../src/core/config.js";

const cfg = loadConfig();
const account = agentAccount();

if (account.address.toLowerCase() !== cfg.agentWallet.toLowerCase()) {
  console.warn(`⚠  key address ${account.address} != registered agentWallet ${cfg.agentWallet}`);
}

if (await isRegistered(account.address)) {
  console.log(`✓ already registered on ERC-8004: ${account.address}`);
  process.exit(0);
}

console.log(`Registering ${account.address} on ERC-8004 (${identityRegistry()})`);
console.log(`  agentURI: ${AGENT_URI}`);
console.log(`  tag:      ${cfg.attributionTag}`);

const wallet = walletClient();
const hash = await wallet.writeContract({
  address: identityRegistry(),
  abi: ERC8004_ABI,
  functionName: "register",
  args: [AGENT_URI, []],
  dataSuffix: tagSuffix(), // ERC-8021 attribution appended to calldata
});
console.log(`\n→ tx sent: ${hash}`);
console.log(`  ${cfg.network.explorer}/tx/${hash}`);

const receipt = await publicClient().waitForTransactionReceipt({ hash });
console.log(`\n✓ confirmed in block ${receipt.blockNumber} (status: ${receipt.status})`);
console.log(`  Paste this hash into the loops "Verify tag" box, and click "Check on Celo" for ERC-8004.`);
