/** The BillLeash logo as inline SVG (from assets/brand) — a leash collaring a $ coin. */
export function Icon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="BillLeash">
      <defs>
        <linearGradient id="bgI" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0c4433" />
          <stop offset="1" stopColor="#06231a" />
        </linearGradient>
        <linearGradient id="limeI" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dbf75f" />
          <stop offset="1" stopColor="#a6e039" />
        </linearGradient>
        <radialGradient id="glowI" cx="0.44" cy="0.36" r="0.7">
          <stop offset="0" stopColor="#1f7d5c" stopOpacity="0.5" />
          <stop offset="1" stopColor="#1f7d5c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="118" fill="url(#bgI)" />
      <rect width="512" height="512" rx="118" fill="url(#glowI)" />
      <rect x="6" y="6" width="500" height="500" rx="112" fill="none" stroke="#dff77f" strokeOpacity="0.12" strokeWidth="2" />
      <g fill="none" stroke="url(#limeI)" strokeLinecap="round">
        <path d="M150 96 C 150 150, 150 150, 150 188" strokeWidth="30" />
        <circle cx="150" cy="232" r="40" strokeWidth="30" />
        <path d="M188 258 C 214 276, 214 276, 236 294" strokeWidth="20" />
      </g>
      <g>
        <circle cx="322" cy="312" r="126" fill="url(#limeI)" />
        <circle cx="322" cy="312" r="126" fill="none" stroke="#06231a" strokeOpacity="0.16" strokeWidth="7" />
        <circle cx="322" cy="312" r="104" fill="none" stroke="#06231a" strokeOpacity="0.16" strokeWidth="4" strokeDasharray="3 10" />
        <text x="322" y="356" fontFamily="DejaVu Sans, Arial, sans-serif" fontSize="150" fontWeight="800" fill="#06231a" textAnchor="middle">$</text>
      </g>
    </svg>
  );
}

export function Wordmark() {
  return (
    <div className="wordmark">
      <Icon size={44} />
      <div className="wordmark-text">
        <span className="wordmark-name">
          Bill<span className="wordmark-accent">Leash</span>
        </span>
        <span className="wordmark-tag">Pay dollar bills from naira — on a leash.</span>
      </div>
    </div>
  );
}
