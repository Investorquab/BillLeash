import { useEffect, useState } from "react";
import { Wordmark } from "./components/BrandMark";
import { IdentityCard } from "./components/IdentityCard";
import { LeashCard } from "./components/LeashCard";
import { RatesPanel } from "./components/RatesPanel";
import { FeedList } from "./components/FeedList";
import { PayBillModal } from "./components/PayBillModal";
import { SEED_FEED, SEED_LEASH, type FeedEvent, type LeashState } from "./data/seed";
import { BRAND, CHAIN, ERC8004 } from "./data/config";
import { readBlock } from "./lib/chain";
import { connectWallet, revokeLeash, grantLeash } from "./lib/altana";
import { remainingUsd } from "./lib/decision";
import { usd } from "./lib/format";

export default function App() {
  const [leash, setLeash] = useState<LeashState>(SEED_LEASH);
  const [feed, setFeed] = useState<FeedEvent[]>(SEED_FEED);
  const [payOpen, setPayOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [block, setBlock] = useState<bigint | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    readBlock().then((b) => { if (alive) setBlock(b); });
    const iv = setInterval(() => readBlock().then((b) => { if (alive) setBlock(b); }), 30_000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4200);
  }

  async function onConnect() {
    const r = await connectWallet();
    setWallet(r.walletAddress);
    const g = await grantLeash();
    flash(`${r.note} ${g.note}`);
  }

  async function onRevoke() {
    setRevoking(true);
    const r = await revokeLeash();
    await new Promise((res) => setTimeout(res, 700));
    setLeash((l) => ({ ...l, status: "revoked" }));
    setFeed((f) => [
      {
        id: `revoke-${Date.now()}`,
        kind: "revoke",
        status: "demo",
        title: "Leash revoked — agent authority killed",
        detail: r.note,
        tsIso: new Date().toISOString(),
      },
      ...f,
    ]);
    setRevoking(false);
    flash("⛔ Leash revoked. The agent can no longer move money.");
  }

  function onRegrant() {
    setLeash({ ...SEED_LEASH, expiry: Math.floor(Date.now() / 1000) + 7 * 86400, status: "active" });
    flash("Leash re-granted (demo reset).");
  }

  function onPaid(e: FeedEvent) {
    setFeed((f) => [e, ...f]);
    setLeash((l) => ({ ...l, spentUsd: (Number(l.spentUsd) + Number(e.usd ?? 0)).toFixed(2) }));
    flash(`Paid ${e.vendor} — $${e.usd}. Receipt added to the feed.`);
  }

  const remaining = remainingUsd(leash);

  return (
    <div className="wrap">
      <header className="topbar">
        <Wordmark />
        <div className="topbar-right">
          <span className="net-pill">
            <span className="dot live" /> Celo mainnet · {CHAIN.chainId}
            {block != null && <span style={{ color: "var(--mint)", fontWeight: 500 }}>· #{block.toString()}</span>}
          </span>
          <a className="ghost-btn" href={BRAND.repo} target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </header>

      <section className="hero">
        <div>
          <h1>An agent that pays dollar bills from your local currency — on a leash you control.</h1>
          <p>
            BillLeash converts local-currency stablecoins to USD₮ on Textile FX and pays metered APIs (x402) and
            subscriptions, acting only from a <strong>revocable Altana session key</strong> whose spend cap,
            contract allowlist and expiry are enforced on-chain. Identity via Self + ERC-8004; every transaction
            carries an ERC-8021 attribution tag.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => setPayOpen(true)} disabled={leash.status !== "active"}>
              🧾 Pay a bill
            </button>
            <button className="btn btn-outline btn-lg" onClick={onConnect}>
              {wallet ? "🔑 Connected (passkey)" : "🔑 Connect wallet & grant leash"}
            </button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="k">ERC-8004 agentId</div>
            <div className="v">#{ERC8004.agentId}</div>
            <div className="s">registered on mainnet</div>
          </div>
          <div className="stat">
            <div className="k">Leash status</div>
            <div className="v" style={{ color: leash.status === "revoked" ? "var(--danger)" : "var(--lime-bright)" }}>
              {leash.status === "revoked" ? "Revoked" : "Active"}
            </div>
            <div className="s">${usd(leash.capUsd)}/{leash.period} cap</div>
          </div>
          <div className="stat">
            <div className="k">Remaining this {leash.period}</div>
            <div className="v">${usd(remaining)}</div>
            <div className="s">${usd(leash.spentUsd)} spent</div>
          </div>
          <div className="stat">
            <div className="k">Attribution</div>
            <div className="v" style={{ fontSize: 14 }}>ERC-8021 ✓</div>
            <div className="s">every tx tagged</div>
          </div>
        </div>
      </section>

      <div className="grid">
        <div className="col">
          <IdentityCard />
          <RatesPanel />
        </div>
        <div className="col">
          <LeashCard leash={leash} onRevoke={onRevoke} onRegrant={onRegrant} revoking={revoking} />
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <FeedList events={feed} />
      </div>

      <footer className="foot">
        <div className="chips">
          <span className="chip">Celo mainnet only</span>
          <span className="chip">Non-custodial</span>
          <span className="chip">Rules in code decide money</span>
          <span className="chip">A refusal always wins</span>
        </div>
        <div>
          <a href={BRAND.repo} target="_blank" rel="noreferrer">github.com/Investorquab/BillLeash</a> · Built for Agents
          Open for Business (Celo × Loops House)
        </div>
      </footer>

      {payOpen && <PayBillModal leash={leash} onClose={() => setPayOpen(false)} onPaid={onPaid} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
