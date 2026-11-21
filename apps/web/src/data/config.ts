/**
 * Chain config mirrored from /config/event.json (source of truth). Kept as a
 * typed constant so the static dashboard has zero build-time coupling to the
 * engine and works on any host. Celo mainnet (42220) only.
 */
export const CHAIN = {
  name: "celo-mainnet",
  chainId: 42220,
  rpc: "https://forno.celo.org",
  explorer: "https://celoscan.io",
} as const;

/** ERC-8021 attribution tag appended to every transaction BillLeash broadcasts. */
export const ATTRIBUTION_TAG = "celo_f5886810da35";

export const CONTRACTS = {
  erc8004Identity: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  erc8004Reputation: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  selfAgentIdRegistry: "0xaC3DF9ABf80d0F5c020C06B04Cced27763355944",
  textileFxReactor: "0xa9AA0a64769cBed4d3B1Ceb4Df01CdE915C235b3",
  textileFxFeeController: "0x356f4FBe18893997D2F893AE8860eD6060b4521d",
  textileVaultOrderExecutor: "0x01b006d5c687bde182aa36F542f1f014144742e2",
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
} as const;

export interface TokenInfo {
  address: `0x${string}`;
  decimals: number;
  symbol: string;
  /** Human-facing local name, for the UI. */
  label: string;
  flag?: string;
}

export const TOKENS: Record<string, TokenInfo> = {
  cNGN: { address: "0xF6829D7393dAe24509eb1E52eE8e572e2E271a4f", decimals: 6, symbol: "cNGN", label: "Nigerian naira", flag: "🇳🇬" },
  USDT: { address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6, symbol: "USD₮", label: "Tether USD", flag: "🇺🇸" },
  USDC: { address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6, symbol: "USDC", label: "USD Coin", flag: "🇺🇸" },
  USAT: { address: "0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771", decimals: 6, symbol: "USAT", label: "US dollar", flag: "🇺🇸" },
  IDRX: { address: "0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22", decimals: 2, symbol: "IDRX", label: "Indonesian rupiah", flag: "🇮🇩" },
  wARS: { address: "0x0DC4F92879B7670e5f4e4e6e3c801D229129D90D", decimals: 18, symbol: "wARS", label: "Argentine peso", flag: "🇦🇷" },
  wBRL: { address: "0xD76f5Faf6888e24D9F04Bf92a0c8B921FE4390e0", decimals: 18, symbol: "wBRL", label: "Brazilian real", flag: "🇧🇷" },
  wCOP: { address: "0x8a1D45e102e886510e891d2Ec656a708991e2D76", decimals: 18, symbol: "wCOP", label: "Colombian peso", flag: "🇨🇴" },
  wMXN: { address: "0x337E7456B420bD3481e7FA61fA9850343d610d34", decimals: 18, symbol: "wMXN", label: "Mexican peso", flag: "🇲🇽" },
};

export const AGENT_WALLET =
  "0xc9a4F9af5c56D2E5260D217b20F27E46873436E5" as `0x${string}`;

/**
 * ERC-8004 identity — registered live on Celo mainnet. All fields below were
 * read back on-chain (ownerOf/tokenURI) and the tx calldata was decoded with
 * @celo/attribution-tags to confirm the ERC-8021 tag is present.
 */
export const ERC8004 = {
  agentId: 10082,
  /** register() tx that minted the identity NFT AND carried the attribution tag. */
  registerTx:
    "0x1e36ad61bff6a88db99e06a36017e3ce0bcda3f3c7f563e789d3b50ecbba60bf",
  registerBlock: 83332448,
  registeredAtIso: "2026-11-21T03:53:26Z",
  agentUri:
    "https://raw.githubusercontent.com/Investorquab/BillLeash/main/agent.json",
} as const;

export const BRAND = {
  green: "#0c4433",
  greenDeep: "#06231a",
  lime: "#a6e039",
  limeBright: "#dbf75f",
  mint: "#9fd3b9",
  cream: "#f3fae6",
  repo: "https://github.com/Investorquab/BillLeash",
} as const;

export function explorerTx(hash: string): string {
  return `${CHAIN.explorer}/tx/${hash}`;
}
export function explorerAddr(addr: string): string {
  return `${CHAIN.explorer}/address/${addr}`;
}
export function explorerToken(addr: string): string {
  return `${CHAIN.explorer}/token/${addr}`;
}
