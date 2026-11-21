# BillLeash — build handoff

**Repo:** https://github.com/Investorquab/BillLeash · **Network:** Celo mainnet (42220) only · **Deadline:** 2026-12-07 09:00 UTC (aim: Dec 6).

BillLeash = an agent that pays dollar bills from local-currency stablecoins: converts (Textile FX) → pays (x402 / Agent Vault) from a revocable **Altana** session-key wallet, identity via **Self Agent ID + ERC-8004**, every tx **ERC-8021-tagged**. Target tracks: **1 (Stablecoin Corridors) + 4 (Altana)** primary; 2 (Agent Vault) upside; 3 (Self Agent ID) stretch.

## Fixed facts (source of truth: `config/event.json`)
- Attribution tag: **`celo_f5886810da35`** (append to every tx via `dataSuffix`).
- Agent wallet (registered with loops, one for the whole event): **`0xc9a4F9af5c56D2E5260D217b20F27E46873436E5`**.
- **ERC-8004 agentId: `10082`** — registered (tx `0x1e36ad61…60bf`), tag confirmed in calldata. ✅
- Textile FX (Celo) reactor `0xa9AA0a64…235b3`; corridors cNGN/IDRX/wARS/wBRL/wCOP/wMXN/USAT/G$ ↔ USD₮. Decimals vary (cNGN 6, IDRX 2, wARS 18) — always read `decimals()`.
- x402 facilitator `https://api.x402.celo.org`; Textile RFQ `https://api.textilecredit.com` (`/v2/rfq/preview|request`).

## Done (engine, tested + pushed)
- `src/core/` — config, decimal amounts, ERC-8021 tagger, Textile FX client (preview verified live), decision gate, Altana wrapper, pay-router, wallet/erc8004.
- `scripts/` — `register-8004` (DONE live), `grant-leash`, `revoke-leash`, `quote` (live FX). `npm test` → 10 pass. `npx tsc --noEmit` clean.
- Brand assets, README, `.env.example`, logo.

## Environment notes
- This runs on the `billleash` cloud env (Celo hosts allowlisted). **Node ≥22 built-in `fetch` needs `NODE_USE_ENV_PROXY=1`** here; on a normal VPS, do NOT set it.
- Secrets via `.env` (auto-loaded by `src/core/env.ts`). NEVER commit real keys. `session.json` holds a secret session key — git-ignored.

## What's LEFT — the handover work
Split by who can do it. **Claude Code does everything that does NOT need the user's funds-key.** Money-moving txs are run by whoever holds the key (dedicated agent wallet key may be given to the runner as a secret; the *user's* personal wallet actions stay with the user).

### A. Code to finish (Claude Code)
1. **Textile FX convert** `scripts/convert.ts` — call `/v2/rfq/request` (needs `TEXTILE_API_KEY`), then sign + broadcast the returned order to the reactor with the tag appended. Capture the swap tx hash. → Track 1.
2. **Pay-bill orchestrator** `scripts/pay-bill.ts` — decision gate → (convert if funding currency ≠ USD) → pay via x402/`buy` or Agent Vault → record receipt to `receipts.json`. → Track 2.
3. **Self Agent ID register** `scripts/register-self.ts` — wrap `@selfxyz/agent-sdk` CLI; the scan is a USER step (passport, QR). Capture mainnet agentId. → Track 3 / identity.
4. **Dashboard** `apps/web/` — public, no sign-in for judges. Shows: agent identity (ERC-8004 10082 + Self), the **live leash** (cap/allowlist/expiry), the **bill feed** with Celoscan receipts + Textile rates, a **"Pay a bill"** button, and the **"Revoke" money-shot**. Connect-wallet → grant-leash flow via the Altana browser SDK (passkey). Pre-seed with the real registration tx + labelled demo history. Build with viem; test with the preinstalled Playwright; screenshot for the submission.

### B. Live runs that generate evidence (coordinate with user; capture tx hashes to `private/evidence/onchain.md`)
- Fund the agent wallet with CELO + cNGN (USER). 
- `npm run grant:leash` then `npm run revoke:leash` → Altana grant + **revoke** tx hashes (Track 4).
- `convert` → cNGN→USD₮ swap hash (Track 1).
- `pay-bill` → x402 payment hash + `buy` call (Track 2); Agent Vault run-report (needs AV account).
- Collect counters for the proof numbers from day one.

### C. Deploy + submit
- Deploy `apps/web` to a public host (Vercel/Netlify/Railway — needs the user's account) → the **demoUrl**.
- Fill loops project fields with `loops project update` (ERC-8004 id 10082, Self agentId, named user, per-track tx hashes, video, screenshots, demoUrl, X handles). See `private/submission/fields.md`.
- Record the 3-min video (grant → convert → pay → **revoke**).

## User-only steps (never Claude Code)
Passport scan (Self Agent ID mainnet), funding wallets, creating the Textile test key + Agent Vault account, granting the leash from the user's *own* wallet, and the public X post + follows.
