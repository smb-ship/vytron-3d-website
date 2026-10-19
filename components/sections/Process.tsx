"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RevealLines from "@/components/ui/RevealLines";
import { scrollToY } from "@/lib/navigate";

const stages = [
  {
    id: "connect",
    label: "Connect",
    title: "Gather every signal.",
    body: "Scattered information is drawn into a single field. Nothing is lost, and everything is placed.",
    core: "Nodes drift wide. Lines are faint.",
  },
  {
    id: "understand",
    label: "Understand",
    title: "Let the structure appear.",
    body: "Relationships emerge. Nodes pull together and the lattice begins to explain itself.",
    core: "Nodes tighten. Connections light up.",
  },
  {
    id: "activate",
    label: "Activate",
    title: "Turn clarity into motion.",
    body: "Understanding becomes action. The core brightens and the system is ready to move.",
    core: "Rings align. The nucleus ignites.",
  },
];

export default function Process() {
  const root = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const s = Math.round(self.progress * 2);
        setStage((prev) => (prev === s ? prev : s));
        el.style.setProperty("--p", self.progress.toFixed(3));
      },
    });
    return () => st.kill();
  }, []);

  const goTo = (i: number) => {
    const el = root.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    scrollToY(top + (i / 2) * range + 2);
  };

  return (
    <section id="process" ref={root} className="process" aria-labelledby="process-title">
      <div className="process-pin">
        <div className="container process-layout">
          <RevealLines
            id="process-title"
            lines={["FROM COMPLEXITY", "TO CLARITY."]}
            className="display h-section"
          />

          <ol className="steps" aria-label="Process stages">
            {stages.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="step"
                  data-state={i < stage ? "done" : i === stage ? "active" : "todo"}
                  aria-current={i === stage ? "step" : undefined}
                  onClick={() => goTo(i)}
                >
                  <span className="step-node" aria-hidden="true" />
                  <span className="step-label">{s.label}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="stage-copy">
            {stages.map((s, i) => (
              <div
                key={s.id}
                className="stage-panel"
                data-active={i === stage}
                aria-hidden={i !== stage}
                inert={i !== stage}
              >
                <h3 className="display h-stage">{s.title}</h3>
                <p className="lede">{s.body}</p>
                <p className="mono">Core · {s.core}</p>
              </div>
            ))}
          </div>

          <p className="mono process-hint">Scroll to move through the stages, or select one.</p>
        </div>
      </div>
    </section>
  );
}
