"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { sceneState } from "@/lib/sceneState";
import { live } from "./live";
import { makePointsMaterial } from "./shaders";
import type { Quality } from "./quality";

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WHITE = new THREE.Color("#f4f5ff");

/** Far-field atmospheric particles. Motion lives in the vertex shader (no CPU work per frame). */
export function StarField({ quality }: { quality: Quality }) {
  const group = useRef<THREE.Group>(null);
  const { geometry, material } = useMemo(() => {
    const rnd = mulberry(11);
    const n = quality.stars;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rnd() - 0.5) * 30;
      pos[i * 3 + 1] = (rnd() - 0.5) * 18;
      pos[i * 3 + 2] = -12 + rnd() * 15;
      seed[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const m = makePointsMaterial({
      drift: true,
      size: quality.mobile ? 16 : 20,
      pixelRatio: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, quality.dpr[1]),
    });
    return { geometry: g, material: m };
  }, [quality]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(() => {
    const u = material.uniforms;
    u.uTime.value = live.time;
    u.uScroll.value = sceneState.reduced ? 0 : sceneState.scrollY * 0.0011;
    u.uColorA.value.copy(live.accent).lerp(WHITE, 0.45);
    u.uColorB.value.copy(live.primary);
    u.uOpacity.value = 0.55 + 0.35 * live.pose.dim;
    if (group.current) {
      group.current.position.x = -live.pointer.x * 0.5;
      group.current.position.y = -live.pointer.y * 0.3;
    }
  });

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

/** Fine dust orbiting the core in a thick shell. Rotated as a group. */
export function OrbitDust({ quality }: { quality: Quality }) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    const rnd = mulberry(23);
    const n = quality.dust;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 1.15 + Math.pow(rnd(), 0.7) * 1.35;
      const th = rnd() * Math.PI * 2;
      const y = (rnd() - 0.5) * (0.4 + rnd() * 1.2);
      pos[i * 3] = Math.cos(th) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(th) * r;
      seed[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const m = makePointsMaterial({
      drift: false,
      size: quality.mobile ? 14 : 17,
      pixelRatio: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, quality.dpr[1]),
    });
    return { geometry: g, material: m };
  }, [quality]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((_, dt) => {
    const u = material.uniforms;
    u.uColorA.value.copy(live.accent).lerp(WHITE, 0.35);
    u.uColorB.value.copy(live.primary);
    u.uOpacity.value = (0.55 + live.focus.nodes * 0.4) * live.pose.dim;
    if (ref.current) {
      ref.current.rotation.y += Math.min(dt, 0.05) * 0.09 * live.ringSpeed * (sceneState.reduced ? 0.2 : 1);
    }
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
