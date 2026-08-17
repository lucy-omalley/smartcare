export function FamilyIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Family illustration — parents and child reading together"
    >
      <defs>
        <linearGradient id="warmGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFEDD5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" rx="32" fill="url(#warmGlow)" />
      <ellipse cx="240" cy="320" rx="200" ry="40" fill="url(#floor)" />
      {/* Couch */}
      <rect x="80" y="220" width="320" height="72" rx="20" fill="#F97316" fillOpacity="0.25" />
      <rect x="100" y="200" width="280" height="48" rx="16" fill="#FB923C" fillOpacity="0.35" />
      {/* Parent left */}
      <circle cx="150" cy="175" r="28" fill="#FDBA74" />
      <path d="M118 210 Q150 195 182 210 L182 260 L118 260 Z" fill="#EA580C" fillOpacity="0.5" />
      {/* Child center */}
      <circle cx="240" cy="190" r="22" fill="#FDE68A" />
      <path d="M218 215 Q240 205 262 215 L262 250 L218 250 Z" fill="#F59E0B" fillOpacity="0.55" />
      {/* Parent right */}
      <circle cx="330" cy="170" r="26" fill="#FDBA74" />
      <path d="M302 202 Q330 188 358 202 L358 258 L302 258 Z" fill="#C2410C" fillOpacity="0.45" />
      {/* Book / stars */}
      <rect x="220" y="228" width="40" height="28" rx="4" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="2" />
      <circle cx="380" cy="80" r="3" fill="#FBBF24" opacity="0.8" />
      <circle cx="100" cy="100" r="2" fill="#FBBF24" opacity="0.6" />
      <circle cx="400" cy="140" r="2.5" fill="#FBBF24" opacity="0.7" />
      <path d="M60 60 Q120 40 180 70" stroke="#FDBA74" strokeWidth="2" strokeOpacity="0.3" fill="none" />
    </svg>
  );
}
