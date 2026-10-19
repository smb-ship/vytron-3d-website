"use client";

import { useId, useMemo, useState } from "react";

const W = 560;
const H = 220;
const N = 140;

function build(turbulence: number) {
  const t = turbulence / 100;
  const input: number[] = [];
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    const base = Math.sin(x * Math.PI * 4) * 0.55;
    const chaos =
      Math.sin(x * 61 + 1.3) * 0.5 * t + Math.sin(x * 97 + 0.4) * 0.35 * t + Math.sin(x * 143) * 0.25 * t * t;
    input.push(base + chaos);
  }
  // the response keeps the shape of the signal but re-tunes its smoothing as turbulence rises
  const win = Math.max(1, Math.round(2 + t * 11));
  const response = input.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let k = -win; k <= win; k++) {
      const j = i + k;
      if (j >= 0 && j < N) {
        sum += input[j];
        count++;
      }
    }
    return (sum / count) * 0.95;
  });
  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = (i / (N - 1)) * W;
        const y = H / 2 - v * (H * 0.36);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  return { input: toPath(input), response: toPath(response), win };
}

export default function AdaptiveVisual() {
  const [turb, setTurb] = useState(28);
  const id = useId();
  const paths = useMemo(() => build(turb), [turb]);
  const gain = (1 / (1 + turb / 55)).toFixed(2);
  const label = turb < 34 ? "Calm" : turb < 67 ? "Shifting" : "Turbulent";

  return (
    <div className="cap-visual glass adaptive" data-panel>
      <div className="cap-visual-head">
        <span className="mono">Incoming signal</span>
        <span className="mono">System response</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Signal and adapted response at ${label} turbulence`} className="wave">
        <defs>
          <linearGradient id={`${id}-r`} x1="0" x2="1">
            <stop stopColor="#7857FF" />
            <stop offset="1" stopColor="#59E7FF" />
          </linearGradient>
        </defs>
        <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="rgba(185,172,255,.18)" strokeDasharray="3 7" />
        <path d={paths.input} fill="none" stroke="rgba(244,245,255,.34)" strokeWidth="1.25" />
        <path d={paths.response} fill="none" stroke={`url(#${id}-r)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="slider">
        <label htmlFor={`${id}-range`}>Turbulence</label>
        <input
          id={`${id}-range`}
          type="range"
          min={0}
          max={100}
          value={turb}
          onChange={(e) => setTurb(Number(e.target.value))}
          aria-valuetext={`${label}, ${turb} percent`}
          style={{ ["--fill" as string]: `${turb}%` }}
        />
        <output htmlFor={`${id}-range`} className="mono">
          {label} · gain ×{gain}
        </output>
      </div>
    </div>
  );
}
