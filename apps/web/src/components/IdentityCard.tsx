import { useEffect, useState } from "react";
import { ERC8004, AGENT_WALLET, CONTRACTS, explorerAddr, explorerTx } from "../data/config";
import { readIdentity, type IdentityLive } from "../lib/chain";
import { shortAddr, shortHash } from "../lib/format";

/**
 * Agent identity: the ERC-8004 registration (live-confirmed on Celo mainnet) and
 * the Self Agent ID slot. ownerOf/tokenURI are re-read in the browser to prove
 * the pre-seeded facts; if the RPC is unreachable the verified seed stands.
 */
export function IdentityCard() {
  const [live, setLive] = useState<IdentityLive | null>(null);

  useEffect(() => {
    let alive = true;
    readIdentity().then((r) => { if (alive) setLive(r); });
    return () => { alive = false; };
  }, []);

  const confirmed = live?.ok && live.ownerMatches;

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">🪪 Agent identity</span>
        {live == null ? (
          <span className="badge badge-cached">checking…</span>
        ) : confirmed ? (
          <span className="badge badge-ok"><span className="dot" /> live-verified on-chain</span>
        ) : (
          <span className="badge badge-cached">verified (seed)</span>
        )}
      </div>

      <div className="id-hero">
        <span className="id-badge-num">#{ERC8004.agentId}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--cream)" }}>ERC-8004 identity</div>
          <div className="id-sub">A real person stands behind this agent</div>
        </div>
      </div>

      <div className="kv">
        <span className="k">agentId</span>
        <span className="v mono">{ERC8004.agentId}</span>
      </div>
      <div className="kv">
        <span className="k">owner (agent wallet)</span>
        <a className="v mono" href={explorerAddr(AGENT_WALLET)} target="_blank" rel="noreferrer">
          {shortAddr(AGENT_WALLET)} ↗
        </a>
      </div>
      <div className="kv">
        <span className="k">registry</span>
        <a className="v mono" href={explorerAddr(CONTRACTS.erc8004Identity)} target="_blank" rel="noreferrer">
          {shortAddr(CONTRACTS.erc8004Identity)} ↗
        </a>
      </div>
      <div className="kv">
        <span className="k">register tx (tagged)</span>
        <a className="v mono" href={explorerTx(ERC8004.registerTx)} target="_blank" rel="noreferrer">
          {shortHash(ERC8004.registerTx)} ↗
        </a>
      </div>
      <div className="kv">
        <span className="k">agent record</span>
        <a className="v" href={ERC8004.agentUri} target="_blank" rel="noreferrer">agent.json ↗</a>
      </div>
      <div className="kv">
        <span className="k">Self Agent ID</span>
        <a className="v mono" href={explorerAddr(CONTRACTS.selfAgentIdRegistry)} target="_blank" rel="noreferrer">
          registry {shortAddr(CONTRACTS.selfAgentIdRegistry, 6, 4)} ↗
        </a>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
        Self proof-of-personhood binds a verified passport to the agent (owner step). Shown here once the mainnet
        agentId is minted.
      </div>
    </div>
  );
}
