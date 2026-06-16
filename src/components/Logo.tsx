/**
 * FirstRung logo. The mark is three ascending rungs that read at once as a
 * ladder and a rising trend line. The lowest "first rung" is brightest,
 * naming the brand: the first step is the one that matters.
 */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fr-rail" x1="8" y1="42" x2="40" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff7a45" />
          <stop offset="1" stopColor="#ffb23e" />
        </linearGradient>
      </defs>

      {/* two rails climbing up to the right */}
      <path d="M11 39 L31 9" stroke="var(--text)" strokeWidth="2.6" strokeLinecap="round" opacity="0.4" />
      <path d="M19 43 L39 13" stroke="var(--text)" strokeWidth="2.6" strokeLinecap="round" opacity="0.4" />

      {/* rungs, ascending */}
      <g stroke="url(#fr-rail)" strokeWidth="3.4" strokeLinecap="round" opacity="0.85">
        <path d="M31 12 L39 16" />
        <path d="M24 23 L32 27" />
      </g>

      {/* the first rung, brightest */}
      <path d="M11 35 L20 39.5" stroke="#ffb23e" strokeWidth="4.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={30} />
      <span className="font-display text-[1.15rem] font-bold tracking-tight">
        First<span className="accent-word">Rung</span>
      </span>
    </span>
  );
}
