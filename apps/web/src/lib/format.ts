/** Small display helpers (no business logic). */

export function shortAddr(addr?: string, lead = 6, tail = 4): string {
  if (!addr) return "—";
  if (addr.length <= lead + tail) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

export function shortHash(hash?: string): string {
  return shortAddr(hash, 10, 8);
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.round((Date.now() - then) / 1000);
  if (Number.isNaN(secs)) return iso;
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function expiryCountdown(expirySec: number): { text: string; expired: boolean } {
  const secs = expirySec - Math.floor(Date.now() / 1000);
  if (secs <= 0) return { text: "expired", expired: true };
  const days = Math.floor(secs / 86400);
  const hrs = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (days > 0) return { text: `${days}d ${hrs}h`, expired: false };
  if (hrs > 0) return { text: `${hrs}h ${mins}m`, expired: false };
  return { text: `${mins}m`, expired: false };
}

export function usd(n: number | string): string {
  const v = typeof n === "string" ? Number(n) : n;
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
