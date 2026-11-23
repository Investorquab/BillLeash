import { useEffect, useState } from "react";
import type { LeashState, FeedEvent } from "../data/seed";
import { TOKENS } from "../data/config";
import { canPay, remainingUsd } from "../lib/decision";
import { previewToUsd, type PreviewResult } from "../lib/textile";
import { BILLS } from "../data/bills";

/** The bills a judge can pay — shared with the agent (mirror of config/bills.json). */
const SAMPLE_BILLS = BILLS;

const FUNDING = ["cNGN", "IDRX", "wARS", "wCOP"];

export function PayBillModal({
  leash,
  onClose,
  onPaid,
}: {
  leash: LeashState;
  onClose: () => void;
  onPaid: (e: FeedEvent) => void;
}) {
  const [billIdx, setBillIdx] = useState(0);
  const [funding, setFunding] = useState("cNGN");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [paying, setPaying] = useState(false);

  const bill = SAMPLE_BILLS[billIdx];
  const decision = canPay({ usdAmount: bill.usd, vendor: bill.vendor }, leash);

  // Fetch a live convert preview: how much local currency to source `bill.usd`.
  useEffect(() => {
    let alive = true;
    setLoadingQuote(true);
    setPreview(null);
    const t = TOKENS[funding];
    // Estimate local amount needed from the headline perUsd (one preview call).
    previewToUsd(funding, "1000")
      .then((p) => {
        if (!alive) return;
        const localNeeded = p.perUsd > 0 ? bill.usd * p.perUsd : 0;
        setPreview({
          ...p,
          sell: localNeeded.toLocaleString("en-US", { maximumFractionDigits: t?.decimals === 18 ? 2 : 0 }),
          outUsd: bill.usd,
        });
      })
      .finally(() => { if (alive) setLoadingQuote(false); });
    return () => { alive = false; };
  }, [funding, billIdx, bill.usd]);

  async function pay() {
    if (!decision.ok) return;
    setPaying(true);
    // Demo settlement — NO real funds move from this public page. A real payment
    // runs from the leashed Altana session (scripts/pay-bill.ts).
    await new Promise((r) => setTimeout(r, 900));
    const ev: FeedEvent = {
      id: `pay-${Date.now()}`,
      kind: "payment",
      status: "demo",
      title: `Paid ${bill.vendor}`,
      detail: `Decision gate ✓ → convert ${funding} → USD₮ → ${bill.rail} settlement from the session key`,
      vendor: bill.vendor,
      rail: bill.rail,
      from: { amount: preview?.sell ?? "—", symbol: funding },
      to: { amount: bill.usd.toFixed(2), symbol: "USD₮" },
      usd: bill.usd.toFixed(2),
      tagged: true,
      tsIso: new Date().toISOString(),
    };
    onPaid(ev);
    setPaying(false);
    onClose();
  }

  const remaining = remainingUsd(leash);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="close">×</button>
        <h3>Pay a bill</h3>
        <div className="sub">
          Convert a local stablecoin → USD₮ on Textile FX, then settle. ${remaining.toFixed(2)} left under the leash.
        </div>

        <div className="field">
          <label>Bill</label>
          <select value={billIdx} onChange={(e) => setBillIdx(Number(e.target.value))}>
            {SAMPLE_BILLS.map((b, i) => (
              <option key={b.vendor} value={i}>
                {b.vendor} — ${b.usd.toFixed(2)} ({b.rail})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Fund from</label>
          <select value={funding} onChange={(e) => setFunding(e.target.value)}>
            {FUNDING.map((f) => (
              <option key={f} value={f}>
                {TOKENS[f]?.flag} {f} — {TOKENS[f]?.label}
              </option>
            ))}
          </select>
        </div>

        <div className="quote-box">
          <div className="quote-line">
            <span>You pay (approx)</span>
            <span className="mono">{loadingQuote ? "quoting…" : `${preview?.sell ?? "—"} ${funding}`}</span>
          </div>
          <div className="quote-line">
            <span>Bill settles</span>
            <span className="big">${bill.usd.toFixed(2)}</span>
          </div>
          <div className="quote-line" style={{ color: "var(--muted)", fontSize: 11.5 }}>
            <span>rate source</span>
            <span>{preview?.live ? "live Textile preview" : "cached (verified)"}</span>
          </div>
        </div>

        <div className={`gate ${decision.ok ? "ok" : "no"}`}>
          <span>{decision.ok ? "✓" : "⛔"}</span>
          <span>
            {decision.ok
              ? "Decision gate: within cap, allowlist & expiry — the agent may pay."
              : `Refused — ${decision.reason}`}
          </span>
        </div>

        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={pay} disabled={!decision.ok || paying || loadingQuote}>
            {paying ? <span className="spinner" /> : decision.ok ? `Pay $${bill.usd.toFixed(2)}` : "Blocked"}
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>
          Public demo — no funds move from this page. Live payments run from the leashed session key.
        </div>
      </div>
    </div>
  );
}
