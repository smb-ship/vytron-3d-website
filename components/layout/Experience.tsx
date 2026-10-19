"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { startScrollDirector } from "@/lib/scrollDirector";
import { prefersReducedMotion } from "@/lib/motion";
import { sceneState } from "@/lib/sceneState";
import { detectWebGL } from "@/lib/webgl";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { VytronSymbol } from "@/components/ui/Wordmark";
import Hero from "@/components/sections/Hero";
import Dimension from "@/components/sections/Dimension";
import CoreSection from "@/components/sections/CoreSection";
import Capabilities from "@/components/sections/Capabilities";
import Process from "@/components/sections/Process";
import Explorer from "@/components/sections/Explorer";
import FinalCta from "@/components/sections/FinalCta";
import Contact from "@/components/sections/Contact";

const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

type GlState = "checking" | "ok" | "none";

/** Scroll-triggered reveals for headlines and panels. Everything created here is reverted on cleanup. */
function useGlobalReveals(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // headline lines: masked rise
      gsap.utils.toArray<HTMLElement>('[data-reveal="scroll"]').forEach((h) => {
        const inner = h.querySelectorAll<HTMLElement>(".rv-inner");
        if (reduced) {
          inner.forEach((n) => n.classList.add("is-in"));
          return;
        }
        gsap.fromTo(
          inner,
          { yPercent: 112, y: 0 },
          {
            yPercent: 0,
            y: 0,
            duration: 1.25,
            ease: "expo.out",
            stagger: 0.11,
            scrollTrigger: { trigger: h, start: "top 86%", once: true },
            onComplete: () => inner.forEach((n) => n.classList.add("is-in")),
          }
        );
      });
      // glass panels: clip-path open
      gsap.utils.toArray<HTMLElement>("[data-panel]").forEach((p) => {
        if (reduced) return;
        gsap.fromTo(
          p,
          { clipPath: "inset(0 0 100% 0 round 20px)", opacity: 0.2 },
          {
            clipPath: "inset(0 0 0% 0 round 20px)",
            opacity: 1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: p, start: "top 88%", once: true },
            onComplete: () => {
              gsap.set(p, { clearProps: "clipPath" });
            },
          }
        );
      });
      // soft fades for supporting copy
      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((f) => {
        if (reduced) return;
        gsap.fromTo(
          f,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: { trigger: f, start: "top 90%", once: true },
          }
        );
      });
      // rules that draw themselves as they enter
      gsap.utils.toArray<HTMLElement>("[data-rule]").forEach((r) => {
        if (reduced) return;
        gsap.fromTo(
          r,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            ease: "none",
            scrollTrigger: { trigger: r, start: "top 92%", end: "top 55%", scrub: true },
          }
        );
      });
    }, el);
    return () => ctx.revert();
  }, [root]);
}

export default function Experience() {
  const [gl, setGl] = useState<GlState>("checking");
  const [sceneReady, setSceneReady] = useState(false);
  const [intro, setIntro] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useGlobalReveals(mainRef);

  useEffect(() => {
    document.documentElement.classList.add("hydrated");
    sceneState.reduced = prefersReducedMotion();
    setGl(detectWebGL() ? "ok" : "none");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.webgl = gl;
  }, [gl]);

  useEffect(() => startScrollDirector(), []);

  // follow live changes of the reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => {
      sceneState.reduced = mq.matches;
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // the intro starts as soon as the first 3D frame is on screen (or immediately without WebGL)
  useEffect(() => {
    if (gl === "checking") return;
    if (gl === "none" || sceneReady) {
      const t = window.setTimeout(() => setIntro(true), 250);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setIntro(true), 6000);
    return () => window.clearTimeout(t);
  }, [gl, sceneReady]);

  const onReady = useCallback(() => setSceneReady(true), []);
  const onFail = useCallback(() => setGl("none"), []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="loader" data-done={intro} role="status" aria-live="polite">
        <VytronSymbol size={44} className="loader-mark" />
        <span className="loader-bar" aria-hidden="true" />
        <span className="sr-only">{intro ? "Experience ready" : "Loading experience"}</span>
      </div>

      {gl === "ok" && (
        <div className="stage-canvas" aria-hidden="true">
          <Scene onReady={onReady} onFail={onFail} />
        </div>
      )}
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <Navigation />
      <main id="main" className="page" ref={mainRef} tabIndex={-1}>
        <Hero ready={intro} />
        <Dimension />
        <CoreSection />
        <Capabilities />
        <Process />
        <Explorer />
        <FinalCta />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
