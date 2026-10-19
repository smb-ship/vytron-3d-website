"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import RevealLines from "@/components/ui/RevealLines";
import SectionLink from "@/components/ui/SectionLink";
import CoreFallback2D from "@/components/ui/CoreFallback2D";
import { prefersReducedMotion } from "@/lib/motion";
import { modes } from "@/lib/modes";
import { sceneState, setFocus, type FocusId } from "@/lib/sceneState";

export default function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const stateEl = useRef<HTMLSpanElement>(null);
  const headingEl = useRef<HTMLSpanElement>(null);
  const nodesEl = useRef<HTMLSpanElement>(null);
  const signalEl = useRef<HTMLSpanElement>(null);
  const override = useRef<string | null>(null);

  // intro: one orchestrated entrance
  useEffect(() => {
    if (!ready || !root.current) return;
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const inner = gsap.utils.toArray<HTMLElement>("h1 .rv-inner");
      const fades = gsap.utils.toArray<HTMLElement>(".hero-fade");
      if (reduced) {
        inner.forEach((n) => n.classList.add("is-in"));
        gsap.set(fades, { opacity: 1 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(inner, { yPercent: 112, y: 0 }, { yPercent: 0, y: 0, duration: 1.6, stagger: 0.16, onComplete: () => inner.forEach((n) => n.classList.add("is-in")) })
        .fromTo(fades, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, clearProps: "transform" }, "-=1.1");
    }, root);
    return () => ctx.revert();
  }, [ready]);

  // scroll: the hero content dissolves while the core travels to the next composition
  useEffect(() => {
    if (!root.current || !content.current || prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to(content.current, {
        opacity: 0,
        yPercent: -10,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "75% top", scrub: true },
      });
      gsap.to(".hero-hud, .hero-tags, .scroll-cue", {
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "45% top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // live readout (direct DOM writes — no React state, no re-renders)
  useEffect(() => {
    const id = window.setInterval(() => {
      const m = modes[sceneState.mode];
      if (stateEl.current) stateEl.current.textContent = override.current ?? m.label;
      if (headingEl.current) {
        const t = performance.now() / 1000;
        const rad = sceneState.current.yaw + t * 0.1 + sceneState.pointer.x * 0.45;
        const deg = ((rad * 180) / Math.PI) % 360;
        headingEl.current.textContent = `${(deg < 0 ? deg + 360 : deg).toFixed(0).padStart(3, "0")}°`;
      }
      if (nodesEl.current) nodesEl.current.textContent = sceneState.mobile ? "22" : "36";
      if (signalEl.current) {
        const v = Math.min(1, 0.45 + sceneState.current.energy * 0.4);
        signalEl.current.style.setProperty("--v", v.toFixed(2));
      }
    }, 140);
    return () => window.clearInterval(id);
  }, []);

  const ping = (label: string) => {
    override.current = label;
    sceneState.burst = Math.max(sceneState.burst, 0.7);
  };
  const clear = () => {
    override.current = null;
  };

  const tagProps = (f: Exclude<FocusId, "none">) => ({
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && setFocus(f),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && setFocus("none"),
    onFocus: () => setFocus(f),
    onBlur: () => setFocus("none"),
    onClick: () => setFocus(f),
  });

  return (
    <section id="hero" ref={root} className="hero" aria-labelledby="hero-title">
      <CoreFallback2D className="hero-fallback" />
      <div className="container hero-grid">
        <div className="hero-content" ref={content}>
          <p className="mono hero-kicker hero-fade">
            <span className="status-dot" aria-hidden="true" /> VYTRON / CORE-01 online
          </p>
          <RevealLines
            as="h1"
            id="hero-title"
            lines={["INTELLIGENCE.", "REIMAGINED."]}
            className="display h-hero"
            mode="intro"
          />
          <p className="lede hero-fade">
            Enter a new dimension of intelligence. Explore adaptive systems designed to connect knowledge, amplify
            creativity, and transform what comes next.
          </p>
          <div className="hero-ctas hero-fade">
            <SectionLink
              to="dimension"
              className="btn btn-primary"
              onPointerEnter={() => ping("Entering")}
              onPointerLeave={clear}
              onFocus={() => ping("Entering")}
              onBlur={clear}
            >
              Enter the experience <ArrowRight size={16} aria-hidden="true" />
            </SectionLink>
            <SectionLink
              to="explorer"
              className="btn btn-ghost"
              onPointerEnter={() => ping("Mapping")}
              onPointerLeave={clear}
              onFocus={() => ping("Mapping")}
              onBlur={clear}
            >
              Explore the system
            </SectionLink>
          </div>
        </div>

        <div className="hero-tags hero-fade">
          <button type="button" className="hero-tag" data-pos="a" {...tagProps("nodes")}>
            <span className="tag-dot" aria-hidden="true" />
            Neural nodes
          </button>
          <button type="button" className="hero-tag" data-pos="b" {...tagProps("lattice")}>
            <span className="tag-dot" aria-hidden="true" />
            Orbital rings
          </button>
        </div>

        <aside className="hero-hud hero-fade" aria-hidden="true">
          <dl>
            <div>
              <dt>State</dt>
              <dd ref={stateEl}>Adaptive</dd>
            </div>
            <div>
              <dt>Heading</dt>
              <dd ref={headingEl}>000°</dd>
            </div>
            <div>
              <dt>Nodes</dt>
              <dd ref={nodesEl}>36</dd>
            </div>
            <div>
              <dt>Signal</dt>
              <dd>
                <span className="signal" ref={signalEl} />
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <SectionLink to="dimension" className="scroll-cue hero-fade" aria-label="Scroll to the next section">
        <span className="scroll-line" aria-hidden="true" />
        <span className="mono">Scroll</span>
      </SectionLink>
    </section>
  );
}
