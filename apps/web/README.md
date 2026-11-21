# BillLeash — public dashboard

The demo surface for BillLeash: a public, no-sign-in dashboard judges can open to
see the live agent.

## What it shows
- **Agent identity** — the ERC-8004 registration (agentId `10082`), re-read live
  on Celo mainnet (`ownerOf`/`tokenURI`) to confirm the pre-seeded facts, plus
  the Self Agent ID slot. Links to Celoscan.
- **The leash** — the Altana session key: spend cap (`$20 USD₮/month`), the
  contract allowlist, and expiry — with a prominent **Revoke** kill-switch.
- **Textile FX rates** — live `preview` of local-currency → USD₮ corridors
  (cNGN, IDRX, wARS, wCOP), with a cached fallback if a browser can't reach the
  API directly (CORS). No key, no spend.
- **Bill feed** — the real registration receipt (Celoscan link) plus
  clearly-labelled demo history. A sample refusal shows the money gate.
- **Pay a bill** — convert a local stablecoin → USD₮ and settle (demo on the
  public page; live payments run from the leashed session key).

## Trust model on this page
This is a read + demonstrate surface. It never holds or requests a private key,
and **no funds move from this page**. Connect/grant/revoke present the real flow
truthfully as a demo; the on-chain admin actions run from the owner's passkey
(`scripts/grant-leash.ts`, `scripts/revoke-leash.ts`). Identity and FX reads are
real, read-only mainnet calls.

## Develop
```bash
cd apps/web
npm install
npm run dev        # http://localhost:5173  (vite proxies /textile → api.textilecredit.com)
```

## Build (static, host anywhere)
```bash
npm run build      # → dist/  (relative base; deploy to Vercel/Netlify/Pages)
npm run preview
```

Celo mainnet (42220) only. Brand: deep green `#0c4433` + lime `#a6e039`.
