import { useId } from "react";

/** Original VYTRON symbol: a "V" of two converging signals, a core node and a tilted orbit. */
export function VytronSymbol({ size = 34, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="4" y1="6" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7857FF" />
          <stop offset="1" stopColor="#59E7FF" />
        </linearGradient>
      </defs>
      <path
        d="M8 9.5 L20 32 L32 9.5"
        stroke={`url(#${id}-g)`}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse
        cx="20"
        cy="19.5"
        rx="16.5"
        ry="6"
        transform="rotate(-24 20 19.5)"
        stroke="#B9ACFF"
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeDasharray="30 22"
      />
      <circle cx="20" cy="19.5" r="3" fill="#F4F5FF" />
      <circle cx="20" cy="19.5" r="5.6" stroke="#59E7FF" strokeOpacity="0.4" strokeWidth="1" />
    </svg>
  );
}

export default function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <span className="wordmark">
      <VytronSymbol size={size} />
      <span className="wordmark-text">VYTRON</span>
    </span>
  );
}
