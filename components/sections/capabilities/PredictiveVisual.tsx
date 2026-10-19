"use client";

import { useId, useState } from "react";

const horizons = [
  { id: "near", label: "Near", reach: 0.64, spread: 0.07 },
  { id: "mid", label: "Mid", reach: 0.82, spread: 0.16 },
  { id: "far", label: "Far", reach: 1, spread: 0.3 },
] as const;

const W = 760;
const H = 240;
const SPLIT = 0.46;

const curve = (x: number) =>
  0.5 + Math.sin(x * 9) * 0.12 + Math.sin(x * 3.1 + 0.7) * 0.2 - x * 0.12 + Math.max(0, x - SPLIT) * 0.28;

export default function PredictiveVisual() {
  const [h, setH] = useState<(typeof horizons)[number]["id"]>("mid");
  const id = useId();
  const cur = horizons.find((x) => x.id === h)!;

  const px = (x: number) => x * W;
  const py = (v: number) => H - v * H * 0.85 - 14;

  const hist: string[] = [];
  for (let x = 0; x <= SPLIT; x += 0.008) hist.push(`${hist.length ? "L" : "M"}${px(x).toFixed(1)} ${py(curve(x)).toFixed(1)}`);

  const fc: string[] = [];
  const upper: string[] = [];
  const lower: string[] = [];
  for (let x = SPLIT; x <= cur.reach + 0.001; x += 0.008) {
    const k = (x - SPLIT) / (1 - SPLIT);
    const band = cur.spread * k * 0.6;
    fc.push(`${fc.length ? "L" : "M"}${px(x).toFixed(1)} ${py(curve(x)).toFixed(1)}`);
    upper.push(`${px(x).toFixed(1)} ${py(curve(x) + band).toFixed(1)}`);
    lower.push(`${px(x).toFixed(1)} ${py(curve(x) - band).toFixed(1)}`);
  }
  const band = `M${upper.join(" L")} L${lower.reverse().join(" L")} Z`;

  return (
    <div className="cap-visual glass predictive" data-panel>
      <div className="predict-head">
        <div role="radiogroup" aria-label="Forecast horizon" className="seg">
          {horizons.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={h === o.id}
              className="seg-btn"
              onClick={() => setH(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="mono">Illustrative data</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Forecast with a ${cur.label.toLowerCase()} horizon. The shaded band widens as the horizon extends.`} className="forecast">
        <defs>
          <linearGradient id={`${id}-b`} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#59E7FF" stopOpacity="0.38" />
            <stop offset="1" stopColor="#7857FF" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2={W} y1={py(g)} y2={py(g)} stroke="rgba(185,172,255,.12)" />
        ))}
        <line x1={px(SPLIT)} x2={px(SPLIT)} y1="8" y2={H - 8} stroke="rgba(244,245,255,.35)" strokeDasharray="2 6" />
        <path d={band} fill={`url(#${id}-b)`} className="band" />
        <path d={hist.join(" ")} fill="none" stroke="#F4F5FF" strokeWidth="2" strokeLinecap="round" />
        <path d={fc.join(" ")} fill="none" stroke="#59E7FF" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
        <circle cx={px(SPLIT)} cy={py(curve(SPLIT))} r="5" fill="#070812" stroke="#F4F5FF" strokeWidth="2" />
      </svg>
      <div className="predict-foot">
        <span className="mono">Observed</span>
        <span className="mono">Forecast · {cur.label.toLowerCase()} horizon</span>
      </div>
    </div>
  );
}
