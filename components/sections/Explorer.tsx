"use client";

import { useEffect, useRef, useState } from "react";
import RevealLines from "@/components/ui/RevealLines";
import { modeOrder, modes, type ModeId } from "@/lib/modes";
import { sceneState, setMode } from "@/lib/sceneState";

export default function Explorer() {
  const [mode, setLocal] = useState<ModeId>("adaptive");
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const m = modes[mode];

  // apply the full mode while the explorer is on screen, a lighter hint elsewhere
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        sceneState.modeStrength = entry.isIntersecting ? 1 : 0.3;
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      sceneState.modeStrength = 0.3;
    };
  }, []);

  const select = (id: ModeId, focus = false) => {
    setLocal(id);
    setMode(id);
    if (focus) tabs.current[modeOrder.indexOf(id)]?.focus();
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const last = modeOrder.length - 1;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = i === last ? 0 : i + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = i === 0 ? last : i - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next >= 0) {
      e.preventDefault();
      select(modeOrder[next], true);
    }
  };

  return (
    <section id="explorer" ref={root} className="section explorer" aria-labelledby="explorer-title">
      <div className="container explorer-grid">
        <div className="explorer-panel">
          <RevealLines id="explorer-title" lines={["EXPLORE", "THE CORE."]} className="display h-section" />
          <p className="lede" data-fade>
            Choose a mode. The core changes its color, speed and structure in real time.
          </p>

          <div role="tablist" aria-label="Core mode" className="mode-tabs">
            {modeOrder.map((id, i) => (
              <button
                key={id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`tab-${id}`}
                type="button"
                aria-selected={mode === id}
                aria-controls="mode-panel"
                tabIndex={mode === id ? 0 : -1}
                className="mode-tab"
                data-mode={id}
                onClick={() => select(id)}
                onKeyDown={(e) => onKey(e, i)}
              >
                <span className="mode-swatch" aria-hidden="true" />
                {modes[id].label}
              </button>
            ))}
          </div>

          <div id="mode-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} className="mode-body glass" data-mode={mode}>
            <h3 className="h-sub">{m.label} mode</h3>
            <p className="body-copy">{m.detail}</p>

            <dl className="meters">
              {(
                [
                  ["Rotation", m.meters.rotation],
                  ["Density", m.meters.density],
                  ["Pulse", m.meters.pulse],
                ] as const
              ).map(([label, v]) => (
                <div key={label} className="meter">
                  <dt>{label}</dt>
                  <dd>
                    <span className="meter-track">
                      <span className="meter-fill" style={{ transform: `scaleX(${v})` }} />
                    </span>
                    <span className="mono">{Math.round(v * 100)}%</span>
                  </dd>
                </div>
              ))}
            </dl>

            <ul className="active-labels" aria-label="Active system labels">
              {m.labels.map((l) => (
                <li key={l}>
                  <span className="tag-dot" aria-hidden="true" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
