import * as THREE from "three";
import { modes } from "@/lib/modes";
import { defaultPose, sceneState, type FocusId } from "@/lib/sceneState";

/**
 * "Live" values read by every 3D component each frame. They are the damped
 * result of: scroll pose + selected mode + hover focus + pointer.
 * Updated exactly once per frame by `stepLive` (see Scene.tsx).
 */
export const live = {
  pose: defaultPose(),
  primary: new THREE.Color("#7857ff"),
  accent: new THREE.Color("#59e7ff"),
  ringSpeed: 1,
  pulseSpeed: 1,
  breathe: 0.05,
  nodeSpread: 0,
  lineBoost: 1,
  align: 0,
  outward: 0,
  strength: 0.3,
  focus: { nucleus: 0, lattice: 0, nodes: 0, strata: 0 } as Record<Exclude<FocusId, "none">, number>,
  time: 0,
  burst: 0,
  pointer: { x: 0, y: 0 },
};

const VIOLET = new THREE.Color("#7857ff");
const CYAN = new THREE.Color("#59e7ff");
const LAV = new THREE.Color("#b9acff");
const tmpA = new THREE.Color();
const tmpB = new THREE.Color();
const tmpC = new THREE.Color();
const tmpD = new THREE.Color();

const { damp } = THREE.MathUtils;

export function stepLive(rawDt: number) {
  const dt = Math.min(rawDt, 0.05);
  const reduced = sceneState.reduced;
  const lam = reduced ? 14 : 3;

  // pose
  const cur = sceneState.current;
  const tgt = sceneState.target;
  (Object.keys(cur) as (keyof typeof cur)[]).forEach((k) => {
    cur[k] = damp(cur[k], tgt[k], lam, dt);
  });
  Object.assign(live.pose, cur);

  // time
  live.time += dt * (reduced ? 0.2 : 1);

  // pointer (damped, disabled for reduced motion)
  const px = reduced ? 0 : sceneState.pointer.x;
  const py = reduced ? 0 : sceneState.pointer.y;
  live.pointer.x = damp(live.pointer.x, px, 2.4, dt);
  live.pointer.y = damp(live.pointer.y, py, 2.4, dt);

  // mode
  const m = modes[sceneState.mode];
  live.strength = damp(live.strength, sceneState.modeStrength, 2.5, dt);
  const k = live.strength;
  const mix = (base: number, mv: number) => base + (mv - base) * k;
  live.ringSpeed = damp(live.ringSpeed, mix(1, m.ringSpeed), 2.5, dt);
  live.pulseSpeed = damp(live.pulseSpeed, mix(1, m.pulseSpeed), 2.5, dt);
  live.breathe = damp(live.breathe, mix(0.05, m.breathe), 2.5, dt);
  live.nodeSpread = damp(live.nodeSpread, m.nodeSpread * k, 2.5, dt);
  live.lineBoost = damp(live.lineBoost, mix(1, m.lineBoost), 2.5, dt);
  live.align = damp(live.align, m.align * k, 2.5, dt);
  live.outward = damp(live.outward, m.outward * k, 2.5, dt);

  // colour: scroll "warmth" picks the base hue pair, selected mode blends on top
  const warm = live.pose.warm;
  tmpA.copy(VIOLET).lerp(CYAN, warm * 0.75);
  tmpB.copy(CYAN).lerp(VIOLET, warm * 0.55).lerp(LAV, 0.12);
  tmpC.set(m.primary);
  tmpD.set(m.accent);
  tmpA.lerp(tmpC, k);
  tmpB.lerp(tmpD, k);
  const cl = 1 - Math.exp(-dt * 3.2);
  live.primary.lerp(tmpA, cl);
  live.accent.lerp(tmpB, cl);

  // focus weights (hover/selection in the "Intelligence Core" section)
  (Object.keys(live.focus) as (keyof typeof live.focus)[]).forEach((f) => {
    live.focus[f] = damp(live.focus[f], sceneState.focus === f ? 1 : 0, 5, dt);
  });

  // mode-change burst
  sceneState.burst = Math.max(0, sceneState.burst - dt * 0.8);
  live.burst = sceneState.burst;
}
