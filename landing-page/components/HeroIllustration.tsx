export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Search engine algorithm and AI neural network visualization"
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="nodeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#2563EB" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Search magnifying glass ring */}
      <circle
        cx="250"
        cy="200"
        r="140"
        stroke="url(#blueGrad)"
        strokeWidth="2"
        strokeDasharray="8 6"
        opacity="0.6"
      />

      {/* Central engine/core */}
      <circle
        cx="250"
        cy="200"
        r="48"
        fill="url(#blueGrad)"
        filter="url(#softShadow)"
      />
      <path
        d="M232 200h36M250 182v36"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Neural network nodes */}
      <g fill="#0F172A" stroke="#BFDBFE" strokeWidth="1.5">
        <circle cx="120" cy="120" r="10" />
        <circle cx="180" cy="90" r="10" />
        <circle cx="90" cy="210" r="10" />
        <circle cx="140" cy="300" r="10" />
        <circle cx="360" cy="100" r="10" />
        <circle cx="410" cy="180" r="10" />
        <circle cx="370" cy="290" r="10" />
        <circle cx="300" cy="330" r="10" />
        <circle cx="210" cy="330" r="10" />
        <circle cx="250" cy="100" r="10" />
        <circle cx="250" cy="300" r="10" />
        <circle cx="140" cy="200" r="10" />
        <circle cx="360" cy="200" r="10" />
      </g>

      {/* Neural connections */}
      <g stroke="#93C5FD" strokeWidth="1.5" opacity="0.5">
        <line x1="120" y1="120" x2="180" y2="90" />
        <line x1="120" y1="120" x2="90" y2="210" />
        <line x1="90" y1="210" x2="140" y2="300" />
        <line x1="180" y1="90" x2="250" y2="100" />
        <line x1="250" y1="100" x2="360" y2="100" />
        <line x1="360" y1="100" x2="410" y2="180" />
        <line x1="410" y1="180" x2="370" y2="290" />
        <line x1="370" y1="290" x2="300" y2="330" />
        <line x1="300" y1="330" x2="210" y2="330" />
        <line x1="210" y1="330" x2="140" y2="300" />
        <line x1="140" y1="200" x2="210" y2="330" />
        <line x1="140" y1="200" x2="250" y2="300" />
        <line x1="360" y1="200" x2="250" y2="300" />
        <line x1="360" y1="200" x2="300" y2="330" />
        <line x1="140" y1="200" x2="250" y2="152" />
        <line x1="360" y1="200" x2="250" y2="152" />
        <line x1="250" y1="100" x2="250" y2="152" />
        <line x1="250" y1="300" x2="250" y2="248" />
      </g>

      {/* Text labels */}
      <text x="250" y="375" textAnchor="middle" fill="#64748B" fontSize="14" fontWeight="500">
        Quality signals · Rankings · User intent
      </text>
    </svg>
  )
}
