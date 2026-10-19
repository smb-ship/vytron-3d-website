"use client";

import { useEffect, useRef, useState } from "react";
import RevealLines from "@/components/ui/RevealLines";
import CoreFallback2D from "@/components/ui/CoreFallback2D";
import { setFocus, type FocusId } from "@/lib/sceneState";

type PartId = Exclude<FocusId, "none">;

const parts: { id: PartId; label: string; title: string; body: string; spec: string }[] = [
  {
    id: "nucleus",
    label: "Nucleus",
    title: "The luminous nucleus",
    body: "Working memory lives here. Every signal converges on this point, and its glow swells as more of the system is in use.",
    spec: "Energy sphere · live shader",
  },
  {
    id: "lattice",
    label: "Orbital lattice",
    title: "The orbital lattice",
    body: "Nested rings turn at different tempos. Each one is a layer of attention: what is happening now, what just changed, and what comes next.",
    spec: "5 rings · chrome, glass, light",
  },
  {
    id: "nodes",
    label: "Neural nodes",
    title: "The neural nodes",
    body: "Small specialists float around the core. They pulse when connected, and the lines between them carry the relationships.",
    spec: "36 nodes · energy pulses",
  },
  {
    id: "strata",
    label: "Glass strata",
    title: "The glass strata",
    body: "Translucent layers separate signal from noise. They bend light so the structure can be seen without exposing its complexity.",
    spec: "2 layers · iridescent glass",
  },
];

export default function CoreSection() {
  const [active, setActive] = useState<PartId | null>(null);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    setFocus(active ?? "none");
  }, [active]);

  // drop the focus state as soon as the section leaves the viewport
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        setActive(null);
        setFocus("none");
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      setFocus("none");
    };
  }, []);

  const current = parts.find((p) => p.id === active);

  return (
    <section id="core" ref={root} className="core-section" aria-labelledby="core-title">
      <div className="core-pin">
        <CoreFallback2D className="core-fallback-center" />
        <div className="container core-layout">
          <RevealLines
            id="core-title"
            lines={["ONE CORE.", "INFINITE POSSIBILITIES."]}
            className="display h-section core-title"
          />

          <div className="hotspots" role="group" aria-label="Core architecture. Select a part to inspect it.">
            {parts.map((p) => (
              <button
                key={p.id}
                type="button"
                className="hotspot"
                data-part={p.id}
                aria-pressed={active === p.id}
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(p.id)}
                onFocus={() => setActive(p.id)}
                onClick={() => setActive(p.id)}
                onKeyDown={(e) => e.key === "Escape" && setActive(null)}
              >
                <span className="hotspot-marker" aria-hidden="true" />
                <span className="hotspot-label">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="core-detail glass" aria-live="polite">
            {current ? (
              <>
                <h3 className="h-sub">{current.title}</h3>
                <p className="body-copy">{current.body}</p>
                <p className="mono">{current.spec}</p>
              </>
            ) : (
              <>
                <h3 className="h-sub">Inspect the architecture</h3>
                <p className="body-copy">
                  Hover or select a part of the core. The structure responds, and its details appear here.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
