import { createPublicClient, http, parseAbi } from "viem";
import { toDataSuffix } from "@celo/attribution-tags";

const celo = createPublicClient({ transport: http("https://forno.celo.org") });
const erc20 = parseAbi(["function name() view returns (string)","function symbol() view returns (string)","function decimals() view returns (uint8)"]);
const results = {};

// 1. attribution tag (pure)
try { results.attributionTag = toDataSuffix("billleash_demo"); } catch(e){ results.attributionTag = "ERR "+e.message; }

// 2. ERC-8004 Identity Registry (Celo mainnet)
try {
  const a = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
  results.erc8004 = { name: await celo.readContract({address:a,abi:erc20,functionName:"name"}).catch(e=>"n/a:"+e.shortMessage),
                      symbol: await celo.readContract({address:a,abi:erc20,functionName:"symbol"}).catch(e=>"n/a") };
} catch(e){ results.erc8004 = "ERR "+e.message; }

// 3. Self Agent ID registry (should be name=Self Agent ID, symbol=SAID)
try {
  const a = "0xaC3DF9ABf80d0F5c020C06B04Cced27763355944";
  results.selfAgentId = { name: await celo.readContract({address:a,abi:erc20,functionName:"name"}),
                          symbol: await celo.readContract({address:a,abi:erc20,functionName:"symbol"}) };
} catch(e){ results.selfAgentId = "ERR "+e.message; }

// 4. Textile FX Celo token sanity (cNGN decimals should be 6, IDRX 2, wARS 18)
try {
  const toks = { cNGN:"0xF6829D7393dAe24509eb1E52eE8e572e2E271a4f", IDRX:"0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22", wARS:"0x0DC4F92879B7670e5f4e4e6e3c801D229129D90D", USDT:"0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" };
  results.textileTokens = {};
  for (const [k,a] of Object.entries(toks)) {
    results.textileTokens[k] = { symbol: await celo.readContract({address:a,abi:erc20,functionName:"symbol"}).catch(()=>"?"),
                                 decimals: await celo.readContract({address:a,abi:erc20,functionName:"decimals"}).catch(()=>"?") };
  }
} catch(e){ results.textileTokens = "ERR "+e.message; }

// 5. Textile LimitOrderReactor exists (has code)
try {
  const code = await celo.getBytecode({ address:"0xa9AA0a64769cBed4d3B1Ceb4Df01CdE915C235b3" });
  results.textileReactorHasCode = !!code && code.length > 2;
} catch(e){ results.textileReactorHasCode = "ERR "+e.message; }

console.log(JSON.stringify(results, null, 2));
