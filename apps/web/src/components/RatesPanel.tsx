import { useEffect, useState } from "react";
import { TOKENS } from "../data/config";
import { loadRateTable } from "../lib/textile";
import { RATES_VERIFIED_ISO } from "../data/seed";

type Row = { symbol: string; perUsd: number; live: boolean; sample: { sell: string; out: number } };

/** Live Textile FX corridor rates (naira & friends → USD₮), with cached fallback. */
export function RatesPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setRows(await loadRateTable());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    loadRateTable().then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, []);

  const anyLive = rows?.some((r) => r.live);

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">💱 Textile FX — live corridors</span>
        {rows == null ? (
          <span className="badge badge-cached">loading…</span>
        ) : anyLive ? (
          <span className="badge badge-live"><span className="dot live" /> live preview</span>
        ) : (
          <span className="badge badge-cached" title={`verified ${RATES_VERIFIED_ISO}`}>cached · last verified</span>
        )}
      </div>

      {(rows ?? []).map((r) => {
        const t = TOKENS[r.symbol];
        return (
          <div className="rate-row" key={r.symbol}>
            <div className="rate-sym">
              <span>{t?.flag}</span> {t?.symbol ?? r.symbol}
            </div>
            <div className="rate-mid">
              1 USD₮ ≈ {r.perUsd ? r.perUsd.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—"} {r.symbol}
              <br />
              <span style={{ fontSize: 10.5, opacity: 0.8 }}>{t?.label}</span>
            </div>
            <div className="rate-out">
              {r.sample.sell} {r.symbol}
              <br />
              → <b>${r.sample.out.toFixed(2)}</b>
            </div>
          </div>
        );
      })}

      <button className="ghost-btn" style={{ width: "100%", marginTop: 12 }} onClick={refresh} disabled={loading}>
        {loading ? "refreshing…" : "↻ Refresh rates"}
      </button>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
        Read-only preview · no key, no spend · token decimals vary (cNGN 6, IDRX 2, wARS 18)
      </div>
    </div>
  );
}
