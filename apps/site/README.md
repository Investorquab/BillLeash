# BillLeash — landing page

A static marketing page for BillLeash, built with the
[Taste Skill](https://github.com/Leonxlnx/taste-skill) design system and the
BillLeash brand (deep green `#0c4433` + lime `#a6e039`, Geist). It passes the
skill's finish gate (`GATE: PASS`, one waiver — see below).

## What it shows
- **Hero** — the live dashboard's leash (cap, contract allowlist, Revoke) as the
  product, with the headline and the main action.
- **How a bill gets paid** — the agent's activity (convert → pay → refuse) as a
  live UI fragment.
- **Cut the leash in one transaction** — the kill-switch statement (a
  `letters-assemble` scroll moment).
- **Eight corridors into dollars** — the local-stablecoin corridors with the
  live Textile FX rates panel.
- **A receipt for every bill** — ERC-8004 identity, the ERC-8021 tag, and the
  bill feed with Celoscan links.
- FAQ, and a close that links to the flow.

The three product images are screenshots of the real dashboard (`apps/web`).

## Serve / deploy
It is plain static HTML + CSS/JS under `assets/` (the Taste Skill kit, pruned to
only what this page uses, MIT-licensed). No build step.

```bash
cd apps/site
python3 -m http.server 8000   # then open http://localhost:8000
```

Deploy the folder to any static host (Vercel/Netlify/Pages). Paths are relative.

## To finish before the demo
- The primary action points at `#how`. Once the dashboard is deployed, point
  "See how it works" / the nav + close button at the dashboard URL (the demoUrl).
- `og:image` points at `assets/img/dash-leash.webp`; swap for a dedicated
  share tile if you want one.
- The Self Agent ID is not yet on the page; add it beside the ERC-8004 id once
  the passport scan is done.

## Gate
`GATE: PASS`. One waiver (`.taste-skill/waivers.json`, git-ignored): the
`#revoke` statement section fills 45% of a phone screen — a `letters-assemble`
moment is type-led, so the large statement is the section's content, and the
0.55 fill aim is calibrated for ordinary sections.
