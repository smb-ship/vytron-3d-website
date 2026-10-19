export interface Quality {
  mobile: boolean;
  dpr: [number, number];
  stars: number;
  dust: number;
  nodes: number;
  pulses: number;
  ticks: number;
  sphereSeg: number;
  ringSeg: number;
}

/** Chooses a rendering budget. Phones and coarse-pointer devices get a lighter scene. */
export function getQuality(): Quality {
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const mobile = w < 820 || coarse;
  return mobile
    ? { mobile, dpr: [1, 1.5], stars: 380, dust: 120, nodes: 22, pulses: 12, ticks: 48, sphereSeg: 40, ringSeg: 96 }
    : { mobile, dpr: [1, 1.75], stars: 1100, dust: 360, nodes: 36, pulses: 26, ticks: 84, sphereSeg: 96, ringSeg: 180 };
}
