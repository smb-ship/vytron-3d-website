import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { prefersReducedMotion } from "./motion";

let registered = false;

/**
 * Smoothly scrolls to a section. The tween is killed automatically when the
 * visitor grabs the scroll themselves (wheel / touch / keys), so natural
 * scrolling is never hijacked.
 */
export function scrollToSection(id: string, opts: { focus?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  if (!registered) {
    gsap.registerPlugin(ScrollToPlugin);
    registered = true;
  }
  const finish = () => {
    if (opts.focus !== false) {
      el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    }
    history.replaceState(null, "", `#${id}`);
  };
  if (prefersReducedMotion()) {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY });
    finish();
    return;
  }
  gsap.to(window, {
    duration: 1.5,
    ease: "power3.inOut",
    scrollTo: { y: el, autoKill: true, offsetY: 0 },
    onComplete: finish,
  });
}

/** Eases the window to an absolute scroll position (instant under prefers-reduced-motion). */
export function scrollToY(y: number) {
  if (typeof window === "undefined") return;
  if (!registered) {
    gsap.registerPlugin(ScrollToPlugin);
    registered = true;
  }
  if (prefersReducedMotion()) {
    window.scrollTo({ top: y });
    return;
  }
  gsap.to(window, { duration: 1.1, ease: "power3.inOut", scrollTo: { y, autoKill: true } });
}
