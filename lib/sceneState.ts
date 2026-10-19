import type { ModeId } from "./modes";

/**
 * Shared, mutable scene state.
 *
 * The 3D scene reads this every frame; React never re-renders because of it.
 * GSAP ScrollTrigger (see scrollDirector.ts) writes `target`, the render loop
 * damps `current` towards it, so motion stays weightless and decoupled from
 * the scroll event rate.
 */
export interface Pose {
  x: number; // world units (desktop framing; scaled for aspect)
  y: number;
  scale: number;
  yaw: number; // extra rotation around Y (radians) — "camera orbit"
  pitch: number;
  roll: number;
  dim: number; // 0..1 overall intensity (keeps text legible)
  spread: number; // neural-node scatter, 0 tight … 1 scattered
  lines: number; // neural line visibility 0..1
  energy: number; // nucleus + pulse intensity 0..1.5
  ringOpen: number; // ring radius expansion 0..1
  ringAlign: number; // 0 tumbling … 1 aligned
  camZ: number;
  warm: number; // 0 violet-led … 1 cyan-led lighting
}

export const defaultPose = (): Pose => ({
  x: 0,
  y: 0,
  scale: 1,
  yaw: 0,
  pitch: 0,
  roll: 0,
  dim: 1,
  spread: 0.3,
  lines: 0.6,
  energy: 1,
  ringOpen: 0,
  ringAlign: 0,
  camZ: 7,
  warm: 0.3,
});

export type FocusId = "none" | "nucleus" | "lattice" | "nodes" | "strata";

export const sceneState = {
  target: defaultPose(),
  current: defaultPose(),
  mode: "adaptive" as ModeId,
  /** true while the Explorer section should apply the selected mode strongly */
  modeStrength: 0.35,
  focus: "none" as FocusId,
  pointer: { x: 0, y: 0 },
  scrollY: 0,
  scrollProgress: 0,
  burst: 0,
  reduced: false,
  mobile: false,
  /** set once the first frame has rendered */
  ready: false,
};

export function setMode(mode: ModeId) {
  if (sceneState.mode !== mode) {
    sceneState.mode = mode;
    sceneState.burst = 1;
  }
}

export function setFocus(focus: FocusId) {
  sceneState.focus = focus;
}
