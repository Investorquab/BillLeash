# BillLeash

**Pay your dollar bills from naira — under a leash you control.**

BillLeash is an AI agent that pays dollar-denominated bills (metered APIs, card
subscriptions) out of a local-currency stablecoin balance. It converts the local
stablecoin to USD₮ on **Textile FX**, pays via **x402** (metered) or **Agent
Vault** (card checkout), and acts only from a **revocable Altana session-key
wallet** whose spend cap, contract allowlist and expiry are enforced on-chain.
Its identity is a **Self Agent ID + ERC-8004** registration — a real person
stands behind it — and every transaction it broadcasts carries an **ERC-8021**
attribution tag. Everything runs on **Celo mainnet**.

Built for the **Agents Open for Business** hackathon (Celo × Loops House).

## Why
In Nigeria and much of the world, people earn in local currency but pay for
software and infrastructure in dollars (VPS, AI/transcription APIs, SaaS,
domains). Getting dollars and paying each bill is a recurring, manual chore.
BillLeash does it automatically, within limits you set and can cut off in one
transaction — so you can leave an agent running without handing it your funds.

## How it works
1. **Leash.** You (admin key / passkey) grant the agent an Altana session scoped
   to a spend cap, a contract allowlist (Textile reactor + the stablecoins + each
   vendor), and an expiry. Enforced on-chain by the wallet — revoke in one tx.
2. **Convert.** When a bill is due, the agent gets a firm Textile FX quote and
   swaps your local stablecoin → USD₮ in one transaction (tagged).
3. **Pay.** Metered endpoints are paid via **x402** from the session key; card
   subscriptions via **Agent Vault** (the agent never sees the card number).
4. **Prove.** Every broadcast tx carries the attribution tag; receipts are shown
   on a public dashboard with the live leash and a **revoke** button.

## Supported corridors (Textile FX, Celo mainnet — verified live)
cNGN · IDRX · wARS · wBRL · wCOP · wMXN · USAT · G$ ↔ USD₮. Token decimals vary
(cNGN 6, IDRX 2, wARS 18); amount math reads each token's `decimals()`.

## Project layout
```
config/event.json     # network, attribution tag, verified contract/token addresses
src/core/             # engine
  config.ts           #   config + token resolver
  amounts.ts          #   decimal-aware base-unit math
  tag.ts              #   ERC-8021 attribution (append the loops tag)
  textile.ts          #   Textile FX v2 RFQ client (preview verified live)
  altana.ts           #   leash: grant / pay-x402 / revoke / verify
  payrouter.ts        #   pay a bill by rail (x402 / buy / agent-vault)
  decision.ts         #   money gate (cap, allowlist, expiry) — refusal wins
scripts/quote.ts      # live Textile FX quote (read-only, no key, no spend)
test/                 # unit tests
```

## Try the FX quote (read-only, no key, no funds)
```bash
npm install
NODE_USE_ENV_PROXY=1 npm run quote -- cNGN USDT 50000
```

## Run the tests
```bash
npm test
```

## Trust model
Non-custodial. The owner holds the admin key; the agent holds only a capped,
expiring session key. Spend cap, contract allowlist and expiry are enforced
on-chain by the Altana wallet — not by application code — and revocable in one
transaction. The agent never sees a card number or password (Agent Vault mock
tokens). No server holds user funds or keys. A refusal always wins: rules in
code (and on-chain limits) decide whether money moves — never a model.

## Status & honesty
- FX leg (Textile FX v2 RFQ `preview`) **verified live on Celo mainnet** across
  multiple corridors. Firm `request` + settlement, Altana grant/execute/revoke,
  and the Agent Vault card leg run with the owner's wallet/accounts and are being
  wired up during the hackathon. Not audited by a third party.
- Mainnet only; small amounts.

## Configuration
Secrets are supplied via environment variables where the agent runs; nothing
secret lives in this repo. See `.env.example`.
