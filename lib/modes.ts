export type ModeId = "adaptive" | "knowledge" | "predictive";

export interface ModeDefinition {
  id: ModeId;
  label: string;
  summary: string;
  detail: string;
  /** primary / accent colours as hex */
  primary: string;
  accent: string;
  /** animation parameters consumed by the 3D scene */
  ringSpeed: number; // multiplier
  pulseSpeed: number; // multiplier
  breathe: number; // nucleus breathing amplitude
  nodeSpread: number; // added to node radius (0 = tight)
  lineBoost: number; // multiplier on neural line opacity
  align: number; // 0 = tumbling rings, 1 = aligned gyroscope
  outward: number; // 0 = pulses travel inward, 1 = sweep outward
  /** readouts 0..1 for the UI bars */
  meters: { rotation: number; density: number; pulse: number };
  labels: string[];
}

export const modes: Record<ModeId, ModeDefinition> = {
  adaptive: {
    id: "adaptive",
    label: "Adaptive",
    summary: "The core breathes with incoming change.",
    detail:
      "Rings turn faster and the nucleus swells and settles as new information arrives. Built for environments that never hold still.",
    primary: "#7857FF",
    accent: "#59E7FF",
    ringSpeed: 1.7,
    pulseSpeed: 1.0,
    breathe: 0.09,
    nodeSpread: 0.1,
    lineBoost: 0.8,
    align: 0.0,
    outward: 0.3,
    meters: { rotation: 0.86, density: 0.5, pulse: 0.55 },
    labels: ["Context sensing", "Self-tuning rings", "Fast response"],
  },
  knowledge: {
    id: "knowledge",
    label: "Knowledge",
    summary: "Nodes draw closer and the lattice lights up.",
    detail:
      "Connections take priority over motion. Nodes gather around the nucleus and the lines between them carry the relationships.",
    primary: "#59E7FF",
    accent: "#7857FF",
    ringSpeed: 0.55,
    pulseSpeed: 1.3,
    breathe: 0.03,
    nodeSpread: -0.22,
    lineBoost: 2.2,
    align: 0.35,
    outward: 0.0,
    meters: { rotation: 0.28, density: 0.95, pulse: 0.7 },
    labels: ["Linked nodes", "Relationship map", "Shared context"],
  },
  predictive: {
    id: "predictive",
    label: "Predictive",
    summary: "Rings align and pulses sweep outward.",
    detail:
      "The rings settle into one plane and energy travels outward in sweeps, tracing where the system expects to go next.",
    primary: "#B9ACFF",
    accent: "#F4F5FF",
    ringSpeed: 0.9,
    pulseSpeed: 2.2,
    breathe: 0.05,
    nodeSpread: 0.38,
    lineBoost: 1.0,
    align: 1.0,
    outward: 1.0,
    meters: { rotation: 0.55, density: 0.4, pulse: 0.95 },
    labels: ["Pattern sweep", "Horizon scan", "Forward pulses"],
  },
};

export const modeOrder: ModeId[] = ["adaptive", "knowledge", "predictive"];
