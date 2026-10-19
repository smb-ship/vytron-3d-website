"use client";

import { useMemo, useState } from "react";

const fragments = [
  { id: "notes", label: "Notes", x: 14, y: 22 },
  { id: "metrics", label: "Metrics", x: 46, y: 10 },
  { id: "contracts", label: "Contracts", x: 80, y: 28 },
  { id: "support", label: "Support", x: 20, y: 70 },
  { id: "research", label: "Research", x: 52, y: 58 },
  { id: "roadmap", label: "Roadmap", x: 84, y: 76 },
];

export default function ConnectedVisual() {
  const [picked, setPicked] = useState<string[]>(["metrics", "research"]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const links = useMemo(() => {
    const out: [string, string][] = [];
    for (let i = 0; i < picked.length; i++)
      for (let j = i + 1; j < picked.length; j++) out.push([picked[i], picked[j]]);
    return out;
  }, [picked]);

  const pos = (id: string) => fragments.find((f) => f.id === id)!;

  return (
    <div className="cap-visual glass connected" data-panel>
      <div className="net" role="group" aria-label="Information fragments. Select fragments to connect them.">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {links.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={pos(a).x}
              y1={pos(a).y}
              x2={pos(b).x}
              y2={pos(b).y}
              className="net-link"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {fragments.map((f) => (
          <button
            key={f.id}
            type="button"
            className="fragment"
            aria-pressed={picked.includes(f.id)}
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
            onClick={() => toggle(f.id)}
          >
            <span className="fragment-dot" aria-hidden="true" />
            {f.label}
          </button>
        ))}
      </div>
      <div className="net-foot">
        <p className="mono" aria-live="polite">
          {picked.length} connected · {links.length} {links.length === 1 ? "relationship" : "relationships"}
        </p>
        <div className="net-actions">
          <button type="button" className="chip-btn" onClick={() => setPicked(fragments.map((f) => f.id))}>
            Connect all
          </button>
          <button type="button" className="chip-btn" onClick={() => setPicked([])}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
