import type { FeedEvent } from "../data/seed";
import { ATTRIBUTION_TAG, explorerTx } from "../data/config";
import { shortHash, timeAgo } from "../lib/format";

const ICON: Record<FeedEvent["kind"], string> = {
  identity: "🪪",
  leash: "🔗",
  convert: "💱",
  payment: "🧾",
  revoke: "⛔",
};

function StatusBadge({ s }: { s: FeedEvent["status"] }) {
  if (s === "confirmed") return <span className="badge badge-ok">confirmed</span>;
  if (s === "demo") return <span className="badge badge-demo">demo</span>;
  if (s === "refused") return <span className="badge badge-refused">refused</span>;
  if (s === "pending") return <span className="badge badge-cached">pending</span>;
  return null;
}

/** The bill feed: real receipts (Celoscan links) + clearly-labelled demo history. */
export function FeedList({ events }: { events: FeedEvent[] }) {
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">🧾 Bill feed & receipts</span>
        <span className="badge badge-cached">{events.length} events</span>
      </div>
      <div className="feed">
        {events.map((e) => {
          const refused = e.status === "refused";
          return (
            <div className={`feed-item ${refused ? "refused" : ""}`} key={e.id}>
              <div className={`feed-ic ${refused ? "refused" : ""}`}>{refused ? "⛔" : ICON[e.kind]}</div>
              <div className="feed-body">
                <div className="feed-top">
                  <span className="feed-title">{e.title}</span>
                  <StatusBadge s={e.status} />
                </div>
                <div className="feed-detail">{e.detail}</div>
                <div className="feed-meta">
                  {e.from && e.to && (
                    <span>
                      <span className="feed-amt">{e.from.amount} {e.from.symbol}</span>
                      <span className="arrow"> → </span>
                      <span className="feed-amt">{e.to.amount} {e.to.symbol}</span>
                    </span>
                  )}
                  {!e.from && e.usd && <span className="feed-amt">${e.usd}</span>}
                  {e.rail && <span className="tag-chip">{e.rail}</span>}
                  {e.tagged && <span className="tag-chip" title="ERC-8021 attribution tag in calldata">🏷 {ATTRIBUTION_TAG}</span>}
                  {e.txHash ? (
                    <a href={explorerTx(e.txHash)} target="_blank" rel="noreferrer">
                      {shortHash(e.txHash)} ↗
                    </a>
                  ) : e.status === "demo" ? (
                    <span style={{ color: "var(--muted)" }}>no on-chain receipt (demo)</span>
                  ) : null}
                  <span style={{ marginLeft: "auto", color: "var(--muted)" }}>{timeAgo(e.tsIso)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
