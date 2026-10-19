import { useId } from "react";

/**
 * Static, animated-with-CSS illustration of the core. Shown only when WebGL is
 * unavailable (html[data-webgl="none"]) so the hero is never empty.
 */
export default function CoreFallback2D({ className = "" }: { className?: string }) {
  const id = useId();
  const nodes = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + (i % 2) * 0.3;
    const r = 150 + (i % 3) * 22;
    return { x: 250 + Math.cos(a) * r, y: 250 + Math.sin(a) * r * 0.82 };
  });
  return (
    <div className={`core-fallback ${className}`} aria-hidden="true">
      <svg viewBox="0 0 500 500" focusable="false">
        <defs>
          <radialGradient id={`${id}-n`}>
            <stop offset="0" stopColor="#F4F5FF" />
            <stop offset="0.35" stopColor="#59E7FF" />
            <stop offset="1" stopColor="#7857FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#B9ACFF" />
            <stop offset="1" stopColor="#59E7FF" />
          </linearGradient>
        </defs>
        <circle cx="250" cy="250" r="190" fill={`url(#${id}-n)`} opacity="0.35" />
        <g className="fb-spin-a">
          <ellipse cx="250" cy="250" rx="170" ry="60" fill="none" stroke={`url(#${id}-r)`} strokeWidth="2" transform="rotate(-24 250 250)" />
        </g>
        <g className="fb-spin-b">
          <ellipse cx="250" cy="250" rx="130" ry="130" fill="none" stroke="#B9ACFF" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="4 8" />
        </g>
        <g className="fb-spin-a">
          <ellipse cx="250" cy="250" rx="190" ry="82" fill="none" stroke="#7857FF" strokeOpacity="0.8" strokeWidth="3" transform="rotate(32 250 250)" strokeDasharray="220 120" />
        </g>
        {nodes.map((n, i) => (
          <g key={i}>
            <line x1="250" y1="250" x2={n.x} y2={n.y} stroke="#59E7FF" strokeOpacity="0.12" />
            <circle cx={n.x} cy={n.y} r="3.2" fill="#F4F5FF" opacity="0.9" />
          </g>
        ))}
        <circle cx="250" cy="250" r="46" fill={`url(#${id}-n)`} />
        <circle cx="250" cy="250" r="70" fill="none" stroke="#F4F5FF" strokeOpacity="0.25" />
      </svg>
    </div>
  );
}
