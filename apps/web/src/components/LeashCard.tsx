import { useState } from "react";
import type { LeashState } from "../data/seed";
import { explorerAddr } from "../data/config";
import { shortAddr, expiryCountdown, usd } from "../lib/format";
import { remainingUsd } from "../lib/decision";

/** The live Altana leash: cap, allowlist, expiry — with the Revoke money-shot. */
export function LeashCard({
  leash,
  onRevoke,
  onRegrant,
  revoking,
}: {
  leash: LeashState;
  onRevoke: () => void;
  onRegrant: () => void;
  revoking: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const cap = Number(leash.capUsd);
  const spent = Number(leash.spentUsd);
  const remaining = remainingUsd(leash);
  const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
  const hot = pct > 70;
  const exp = expiryCountdown(leash.expiry);
  const revoked = leash.status === "revoked";

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">🔗 The leash (Altana session key)</span>
        {revoked ? (
          <span className="badge badge-revoked">● revoked</span>
        ) : (
          <span className="badge badge-ok"><span className="dot live" /> active · enforced on-chain</span>
        )}
      </div>

      <div className="leash-cap">
        <span className="big">${usd(cap)}</span>
        <span className="unit">USD₮ / {leash.period}</span>
      </div>
      <div className={`meter ${hot ? "hot" : ""}`}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="leash-sub">
        <span>${usd(spent)} spent</span>
        <span>${usd(remaining)} remaining</span>
      </div>

      <div className="kv" style={{ marginTop: 12 }}>
        <span className="k">expires</span>
        <span className="v">{exp.expired ? "expired" : `in ${exp.text}`}</span>
      </div>
      <div className="kv">
        <span className="k">spend token</span>
        <span className="v">USD₮ (6 dp)</span>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", margin: "14px 0 7px", fontWeight: 600 }}>
        Contract allowlist — the only addresses the agent may touch
      </div>
      <div className="allow-list">
        {leash.allowlist.map((a) => (
          <div className="allow-row" key={a.address}>
            <a className="label mono" href={explorerAddr(a.address)} target="_blank" rel="noreferrer">
              {a.label} · {shortAddr(a.address, 6, 4)} ↗
            </a>
            <span className="kind">{a.kind}</span>
          </div>
        ))}
      </div>

      {revoked ? (
        <>
          <div className="revoked-banner">
            ⛔ LEASH REVOKED — the agent can no longer move money.
          </div>
          <button className="btn btn-outline" style={{ width: "100%", marginTop: 12 }} onClick={onRegrant}>
            Re-grant leash (reset demo)
          </button>
        </>
      ) : (
        <div className="revoke-zone">
          <h4>Kill switch</h4>
          <p>One transaction from your passkey ends the agent's authority everywhere. A refusal always wins.</p>
          {!confirm ? (
            <button className="btn btn-danger btn-lg" style={{ width: "100%" }} onClick={() => setConfirm(true)}>
              ⛔ Revoke the leash
            </button>
          ) : (
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setConfirm(false)} disabled={revoking}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={onRevoke} disabled={revoking}>
                {revoking ? <span className="spinner" /> : "Confirm revoke"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
