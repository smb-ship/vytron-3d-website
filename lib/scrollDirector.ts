import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { defaultPose, sceneState, type Pose } from "./sceneState";
import { prefersReducedMotion } from "./motion";

/**
 * Scroll choreography for the 3D core.
 *
 * Each anchor pins a pose to a point inside a section. As the visitor scrolls
 * the viewport centre travels between anchors and the target pose is
 * interpolated (smoothstep). The render loop then damps the live pose towards
 * the target, so scrolling never feels mechanical. Native scrolling is never
 * intercepted — ScrollTrigger is only used to observe it.
 */
interface AnchorSpec {
  id: string;
  at: number; // 0..1 within the element
  desk: Partial<Pose>;
  mob?: Partial<Pose>;
}

const specs: AnchorSpec[] = [
  {
    id: "hero",
    at: 0.5,
    desk: { x: 2.35, y: 0, scale: 0.98, yaw: 0, pitch: 0.12, dim: 1, spread: 0.25, lines: 0.55, energy: 1, ringOpen: 0, ringAlign: 0, camZ: 7, warm: 0.2 },
    mob: { y: 1.45, scale: 0.6 },
  },
  {
    id: "dimension",
    at: 0.5,
    desk: { x: -2.9, y: 0.1, scale: 1.0, yaw: 1.3, pitch: 0.4, dim: 0.82, spread: 0.7, lines: 0.35, energy: 0.8, ringOpen: 0.55, ringAlign: 0.1, camZ: 7, warm: 0.55 },
    mob: { y: 2.0, scale: 0.55, dim: 0.34 },
  },
  {
    id: "core",
    at: 0.3,
    desk: { x: 0, y: 0, scale: 1.12, yaw: 2.6, pitch: 0.08, dim: 1, spread: 0.4, lines: 0.85, energy: 1.15, ringOpen: 0.15, ringAlign: 0, camZ: 7, warm: 0.4 },
    mob: { y: 0.45, scale: 0.68, dim: 1 },
  },
  {
    id: "core",
    at: 0.7,
    desk: { x: 0, y: 0, scale: 1.12, yaw: 3.0, pitch: 0.08, dim: 1, spread: 0.4, lines: 0.85, energy: 1.15, ringOpen: 0.15, ringAlign: 0, camZ: 7, warm: 0.4 },
    mob: { y: 0.45, scale: 0.68, dim: 1 },
  },
  {
    id: "capabilities",
    at: 0.14,
    desk: { x: 3.9, y: 1.3, scale: 0.55, yaw: 3.4, pitch: 0.3, dim: 0.42, spread: 0.5, lines: 0.5, energy: 0.7, ringOpen: 0.3, ringAlign: 0.3, camZ: 7.2, warm: 0.15 },
    mob: { y: 2.3, scale: 0.42, dim: 0.28 },
  },
  {
    id: "capabilities",
    at: 0.5,
    desk: { x: -4.0, y: 1.1, scale: 0.55, yaw: 4.2, pitch: -0.2, dim: 0.42, spread: 0.3, lines: 0.9, energy: 0.7, ringOpen: 0.1, ringAlign: 0.5, camZ: 7.2, warm: 0.7 },
    mob: { y: 2.3, scale: 0.42, dim: 0.28 },
  },
  {
    id: "capabilities",
    at: 0.86,
    desk: { x: 4.0, y: 1.2, scale: 0.55, yaw: 5.0, pitch: 0.1, dim: 0.42, spread: 0.6, lines: 0.5, energy: 0.8, ringOpen: 0.4, ringAlign: 1, camZ: 7.2, warm: 0.3 },
    mob: { y: 2.3, scale: 0.42, dim: 0.28 },
  },
  {
    // process: three stages across the pinned (sticky) height
    id: "process",
    at: 0.1667,
    desk: { x: 2.3, y: 0, scale: 1.0, yaw: 5.4, pitch: 0.2, dim: 0.95, spread: 1, lines: 0.12, energy: 0.5, ringOpen: 0.95, ringAlign: 0, camZ: 7, warm: 0.5 },
    mob: { y: 1.5, scale: 0.6, dim: 0.5 },
  },
  {
    id: "process",
    at: 0.5,
    desk: { x: 2.3, y: 0, scale: 1.0, yaw: 6.1, pitch: 0.12, dim: 1, spread: 0.1, lines: 1, energy: 0.95, ringOpen: 0.2, ringAlign: 0.6, camZ: 6.7, warm: 0.65 },
    mob: { y: 1.5, scale: 0.6, dim: 0.5 },
  },
  {
    id: "process",
    at: 0.8333,
    desk: { x: 2.3, y: 0, scale: 1.05, yaw: 6.9, pitch: 0.05, dim: 1, spread: 0.3, lines: 0.8, energy: 1.5, ringOpen: 0, ringAlign: 1, camZ: 6.4, warm: 0.05 },
    mob: { y: 1.5, scale: 0.62, dim: 0.55 },
  },
  {
    id: "explorer",
    at: 0.5,
    desk: { x: -2.6, y: 0, scale: 1.1, yaw: 7.4, pitch: 0.1, dim: 1, spread: 0.3, lines: 0.8, energy: 1.1, ringOpen: 0.1, ringAlign: 0, camZ: 6.8, warm: 0.4 },
    mob: { y: 1.7, scale: 0.7, dim: 0.55 },
  },
  {
    id: "cta",
    at: 0.5,
    desk: { x: 0, y: 0, scale: 1.6, yaw: 8.3, pitch: 0.15, dim: 0.42, spread: 0.5, lines: 0.6, energy: 1.25, ringOpen: 0.6, ringAlign: 0.2, camZ: 6.2, warm: 0.5 },
    mob: { y: 0, scale: 0.95, dim: 0.34 },
  },
  {
    id: "contact",
    at: 0.3,
    desk: { x: -3.7, y: -1.5, scale: 0.55, yaw: 9, pitch: 0.2, dim: 0.28, spread: 0.4, lines: 0.5, energy: 0.6, ringOpen: 0.3, ringAlign: 0.3, camZ: 7.4, warm: 0.3 },
    mob: { y: 1.9, scale: 0.5, dim: 0.2 },
  },
];

interface Anchor {
  y: number;
  desk: Pose;
  mob: Pose;
}

let anchors: Anchor[] = [];
const keys = Object.keys(defaultPose()) as (keyof Pose)[];

const smooth = (t: number) => t * t * (3 - 2 * t);

function measure() {
  const base = defaultPose();
  const list: Anchor[] = [];
  for (const s of specs) {
    const el = document.getElementById(s.id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const desk = { ...base, ...s.desk } as Pose;
    const mob = { ...desk, ...s.mob, x: 0 } as Pose;
    list.push({ y: top + s.at * rect.height, desk, mob });
  }
  list.sort((a, b) => a.y - b.y);
  anchors = list;
}

function framing(): { narrow: boolean; scaleFit: number; xFit: number } {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const narrow = aspect < 1 || window.innerWidth < 820;
  const scaleFit = narrow ? 1 : Math.min(1, 0.62 + aspect * 0.22); // 1.78 → 1
  const xFit = narrow ? 0 : Math.min(1, aspect / 1.7);
  return { narrow, scaleFit, xFit };
}

function apply() {
  if (!anchors.length) return;
  const { narrow, scaleFit, xFit } = framing();
  sceneState.mobile = narrow;
  const center = window.scrollY + window.innerHeight * 0.5;
  sceneState.scrollY = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  sceneState.scrollProgress = max > 0 ? window.scrollY / max : 0;

  const i = anchors.findIndex((a) => a.y > center);
  let a: Anchor, b: Anchor, t: number;
  if (i === -1) {
    a = b = anchors[anchors.length - 1];
    t = 0;
  } else if (i === 0) {
    a = b = anchors[0];
    t = 0;
  } else {
    a = anchors[i - 1];
    b = anchors[i];
    t = smooth((center - a.y) / Math.max(1, b.y - a.y));
  }
  const from = narrow ? a.mob : a.desk;
  const to = narrow ? b.mob : b.desk;
  const out = sceneState.target;
  for (const k of keys) {
    out[k] = from[k] + (to[k] - from[k]) * t;
  }
  out.x *= xFit;
  out.scale *= scaleFit;
}

let cleanup: (() => void) | null = null;

/** Starts observing scroll. Returns a cleanup function. */
export function startScrollDirector(): () => void {
  if (cleanup) cleanup();
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  sceneState.reduced = prefersReducedMotion();

  const trigger = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: apply,
    onRefresh: () => {
      measure();
      apply();
    },
  });

  const onResize = () => {
    measure();
    apply();
  };
  window.addEventListener("resize", onResize, { passive: true });
  const onLoad = () => ScrollTrigger.refresh();
  window.addEventListener("load", onLoad);
  // Fonts and the 3D loader change layout height; re-measure shortly after.
  const t1 = window.setTimeout(onResize, 400);
  const t2 = window.setTimeout(() => ScrollTrigger.refresh(), 1400);
  measure();
  apply();
  // start the live pose exactly on the target so there is no opening swoop
  Object.assign(sceneState.current, sceneState.target);

  cleanup = () => {
    trigger.kill();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("load", onLoad);
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    anchors = [];
    cleanup = null;
  };
  return cleanup;
}
