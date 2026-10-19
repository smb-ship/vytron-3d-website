"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { live } from "./live";
import { CHROME_BASE, createCoreMaterials, type CoreMaterials } from "./materials";
import { makePointsMaterial } from "./shaders";
import { OrbitDust } from "./Particles";
import type { Quality } from "./quality";

const { clamp, lerp } = THREE.MathUtils;
const WHITE = new THREE.Color("#f4f5ff");

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/* -------------------------------------------------------------------------- */
/* Nucleus, halo and strata                                                   */
/* -------------------------------------------------------------------------- */

function Nucleus({ mats, quality }: { mats: CoreMaterials; quality: Quality }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const u = mats.nucleus.uniforms;
    u.uTime.value = live.time;
    u.uA.value.copy(live.primary);
    u.uB.value.copy(live.accent);
    u.uEnergy.value = (0.55 + live.pose.energy * 0.6 + live.focus.nucleus * 0.55) * (0.35 + 0.65 * live.pose.dim);
    if (ref.current) {
      const breath = 1 + Math.sin(live.time * 1.3) * live.breathe + live.focus.nucleus * 0.18 + live.burst * 0.12;
      ref.current.scale.setScalar(breath);
    }
  });
  return (
    <mesh ref={ref} material={mats.nucleus}>
      <sphereGeometry args={[0.4, quality.sphereSeg, quality.sphereSeg]} />
    </mesh>
  );
}

function Halo({ mats }: { mats: CoreMaterials }) {
  useFrame(() => {
    const u = mats.halo.uniforms;
    u.uColor.value.copy(live.primary).lerp(live.accent, 0.35);
    u.uOpacity.value = (0.35 + live.pose.energy * 0.4 + live.focus.nucleus * 0.4 + live.burst * 0.3) * live.pose.dim;
  });
  return (
    <Billboard>
      <mesh material={mats.halo} renderOrder={-1}>
        <planeGeometry args={[4.4, 4.4]} />
      </mesh>
    </Billboard>
  );
}

function Strata({ mats, quality }: { mats: CoreMaterials; quality: Quality }) {
  const facet = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    const d = live.pose.dim;
    const f = live.focus.strata;
    mats.glass.color.copy(live.primary).lerp(WHITE, 0.55);
    mats.glassFacet.color.copy(live.accent).lerp(WHITE, 0.5);
    mats.glass.opacity = (0.16 + f * 0.2) * (0.4 + 0.6 * d);
    mats.glassFacet.opacity = (0.11 + f * 0.2) * (0.4 + 0.6 * d);
    mats.glass.envMapIntensity = (1.2 + f * 1.2) * d;
    mats.glassFacet.envMapIntensity = (1.2 + f * 1.2) * d;
    if (facet.current) facet.current.rotation.y -= Math.min(dt, 0.05) * 0.05 * live.ringSpeed;
  });
  return (
    <group>
      <mesh material={mats.glass} renderOrder={2}>
        <sphereGeometry args={[0.66, quality.sphereSeg, quality.sphereSeg]} />
      </mesh>
      <mesh ref={facet} material={mats.glassFacet} renderOrder={2}>
        <icosahedronGeometry args={[0.88, 1]} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Lattice (geometric wire structure)                                         */
/* -------------------------------------------------------------------------- */

function Lattice({ mats }: { mats: CoreMaterials }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const { eOuter, eInner } = useMemo(
    () => ({
      eOuter: new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.02, 1)),
      eInner: new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(0.78, 0)),
    }),
    []
  );
  useEffect(() => () => {
    eOuter.dispose();
    eInner.dispose();
  }, [eOuter, eInner]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const sp = live.ringSpeed;
    const f = live.focus.lattice;
    if (outer.current) {
      outer.current.rotation.y += d * 0.06 * sp;
      outer.current.rotation.x += d * 0.035 * sp;
      outer.current.scale.setScalar(1 + f * 0.07 + live.pose.ringOpen * 0.04);
    }
    if (inner.current) {
      inner.current.rotation.y -= d * 0.09 * sp;
      inner.current.rotation.z += d * 0.05 * sp;
    }
    mats.lattice.color.copy(live.accent).lerp(WHITE, 0.3);
    mats.latticeInner.color.copy(live.primary).lerp(WHITE, 0.35);
    mats.lattice.opacity = (0.3 + f * 0.55) * live.pose.dim;
    mats.latticeInner.opacity = (0.22 + f * 0.4) * live.pose.dim;
  });

  return (
    <group>
      <group ref={outer}>
        <lineSegments geometry={eOuter} material={mats.lattice} />
      </group>
      <group ref={inner}>
        <lineSegments geometry={eInner} material={mats.latticeInner} />
      </group>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Orbital rings                                                              */
/* -------------------------------------------------------------------------- */

type RingKind = "chrome" | "glow" | "glass" | "ticks" | "arc";
interface RingDef {
  r: number;
  tube: number;
  tilt: [number, number, number];
  speed: number;
  kind: RingKind;
  arc?: number;
}

const ringDefs: RingDef[] = [
  { r: 1.24, tube: 0.014, tilt: [1.1, 0.2, 0], speed: 0.2, kind: "chrome" },
  { r: 1.42, tube: 0.05, tilt: [0.45, 0, 0.6], speed: -0.13, kind: "arc", arc: Math.PI * 1.55 },
  { r: 1.6, tube: 0.006, tilt: [1.62, 0.5, 0], speed: 0.24, kind: "glow" },
  { r: 1.82, tube: 0.034, tilt: [0.95, 0, -0.9], speed: 0.09, kind: "glass" },
  { r: 2.06, tube: 0.012, tilt: [0.2, 0.3, 1.2], speed: -0.075, kind: "ticks" },
];

function TickRing({ r, count, mat }: { r: number; count: number; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const long = i % 6 === 0;
      dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      dummy.rotation.set(0, 0, a + Math.PI / 2);
      dummy.scale.set(1, long ? 2.6 : 1, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [r, count]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={mat} frustumCulled={false}>
      <boxGeometry args={[0.012, 0.05, 0.012]} />
    </instancedMesh>
  );
}

function ArcCaps({ r, arc, mat }: { r: number; arc: number; mat: THREE.Material }) {
  return (
    <>
      <mesh position={[r, 0, 0]} material={mat}>
        <sphereGeometry args={[0.045, 16, 16]} />
      </mesh>
      <mesh position={[Math.cos(arc) * r, Math.sin(arc) * r, 0]} material={mat}>
        <sphereGeometry args={[0.045, 16, 16]} />
      </mesh>
    </>
  );
}

function Rings({ mats, quality }: { mats: CoreMaterials; quality: Quality }) {
  const outer = useRef<(THREE.Group | null)[]>([]);
  const spin = useRef<(THREE.Group | null)[]>([]);
  const geos = useMemo(
    () =>
      ringDefs.map((d) =>
        d.kind === "ticks"
          ? null
          : new THREE.TorusGeometry(d.r, d.tube, d.kind === "arc" ? 16 : 10, quality.ringSeg, d.arc ?? Math.PI * 2)
      ),
    [quality.ringSeg]
  );
  useEffect(() => () => geos.forEach((g) => g?.dispose()), [geos]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const t = live.time;
    const a = clamp(live.pose.ringAlign * 0.75 + live.align * 0.85, 0, 1);
    const lf = live.focus.lattice;
    ringDefs.forEach((def, i) => {
      const o = outer.current[i];
      const s = spin.current[i];
      if (!o || !s) return;
      const wob = (1 - a) * 0.06;
      const ax = Math.PI / 2 - 0.12 + (i - 2) * 0.05;
      o.rotation.x = lerp(def.tilt[0], ax, a) + Math.sin(t * 0.3 + i) * wob;
      o.rotation.y = lerp(def.tilt[1], 0, a) + Math.cos(t * 0.27 + i * 1.7) * wob;
      o.rotation.z = lerp(def.tilt[2], 0, a);
      const open = 1 + live.pose.ringOpen * (0.14 + i * 0.07) + lf * 0.03;
      o.scale.setScalar(open);
      s.rotation.z += d * def.speed * live.ringSpeed;
    });
    // materials
    const dim = live.pose.dim;
    mats.chrome.color.copy(CHROME_BASE).multiplyScalar(0.18 + 0.82 * dim);
    mats.chrome.envMapIntensity = (0.5 + 0.95 * dim) * (1 + lf * 0.5);
    mats.glassRing.color.copy(live.primary).lerp(WHITE, 0.5);
    mats.glassRing.opacity = (0.22 + lf * 0.25) * (0.4 + 0.6 * dim);
    mats.glassRing.envMapIntensity = 1.6 * dim;
    mats.glow.color.copy(live.accent);
    mats.glow.opacity = (0.55 + lf * 0.4) * dim;
    mats.cap.color.copy(live.accent).lerp(WHITE, 0.6);
  });

  return (
    <group>
      {ringDefs.map((def, i) => {
        const g = geos[i];
        const material =
          def.kind === "glow" ? mats.glow : def.kind === "glass" ? mats.glassRing : mats.chrome;
        return (
          <group key={i} ref={(el) => { outer.current[i] = el; }}>
            <group ref={(el) => { spin.current[i] = el; }}>
              {def.kind === "ticks" ? (
                <TickRing r={def.r} count={quality.ticks} mat={mats.chrome} />
              ) : (
                g && <mesh geometry={g} material={material} />
              )}
              {def.kind === "arc" && <ArcCaps r={def.r} arc={def.arc ?? Math.PI} mat={mats.cap} />}
            </group>
          </group>
        );
      })}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Neural nodes, connections and energy pulses                                */
/* -------------------------------------------------------------------------- */

function NeuralNet({ mats, quality }: { mats: CoreMaterials; quality: Quality }) {
  const N = quality.nodes;
  const P = quality.pulses;
  const mesh = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const rnd = rng(7);
    const dirs: THREE.Vector3[] = [];
    const radii: number[] = [];
    const phase: number[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = golden * i;
      dirs.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
      radii.push(1.5 + rnd() * 0.55);
      phase.push(rnd() * Math.PI * 2);
    }
    const edges: [number, number][] = [];
    const seen = new Set<string>();
    for (let i = 0; i < N; i++) {
      const order = dirs
        .map((d, j) => ({ j, dist: d.distanceToSquared(dirs[i]) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);
      for (const o of order) {
        const key = i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([i, o.j]);
        }
      }
    }
    const pulses = Array.from({ length: P }, (_, i) => ({
      edge: Math.floor(rnd() * edges.length),
      u: rnd(),
      speed: 0.18 + rnd() * 0.32,
      seed: 0.35 + rnd() * 0.65,
      id: i,
    }));
    return { dirs, radii, phase, edges, pulses, rnd };
  }, [N, P]);

  const objects = useMemo(() => {
    const pos = data.dirs.map(() => new THREE.Vector3());
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(data.edges.length * 6), 3));

    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, quality.dpr[1]);
    const haloGeo = new THREE.BufferGeometry();
    haloGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    haloGeo.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(N).fill(0.95), 1));
    const haloMat = makePointsMaterial({ drift: false, size: quality.mobile ? 34 : 42, pixelRatio: dpr });

    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(P * 3), 3));
    pulseGeo.setAttribute("aSeed", new THREE.BufferAttribute(Float32Array.from(data.pulses.map((p) => p.seed)), 1));
    const pulseMat = makePointsMaterial({ drift: false, size: quality.mobile ? 26 : 32, pixelRatio: dpr });
    return { pos, lineGeo, haloGeo, haloMat, pulseGeo, pulseMat };
  }, [data, N, P, quality]);

  useEffect(
    () => () => {
      objects.lineGeo.dispose();
      objects.haloGeo.dispose();
      objects.haloMat.dispose();
      objects.pulseGeo.dispose();
      objects.pulseMat.dispose();
    },
    [objects]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = live.time;
    const p = live.pose;
    const nf = live.focus.nodes;
    const spreadK = p.spread * 0.9 + live.nodeSpread;
    const radiusMul = clamp(0.72 + spreadK * 0.62, 0.5, 1.75) + live.burst * 0.1;
    const pulseRate = live.pulseSpeed;

    // nodes
    const haloPos = objects.haloGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const base = data.dirs[i];
      const r = data.radii[i] * radiusMul;
      const w = Math.sin(t * 0.6 + data.phase[i]) * 0.05;
      const v = objects.pos[i];
      v.copy(base).multiplyScalar(r + w);
      const pulse = 1 + 0.4 * Math.sin(t * pulseRate * 2 + data.phase[i]);
      const s = 0.032 * pulse * (1 + nf * 0.8);
      dummy.position.copy(v);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
      haloPos.setXYZ(i, v.x, v.y, v.z);
    }
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    haloPos.needsUpdate = true;

    // connections
    const lp = objects.lineGeo.attributes.position as THREE.BufferAttribute;
    for (let e = 0; e < data.edges.length; e++) {
      const [a, b] = data.edges[e];
      lp.setXYZ(e * 2, objects.pos[a].x, objects.pos[a].y, objects.pos[a].z);
      lp.setXYZ(e * 2 + 1, objects.pos[b].x, objects.pos[b].y, objects.pos[b].z);
    }
    lp.needsUpdate = true;

    // pulses
    const pp = objects.pulseGeo.attributes.position as THREE.BufferAttribute;
    data.pulses.forEach((pl, i) => {
      pl.u += dt * pl.speed * pulseRate * (0.5 + p.energy * 0.5);
      if (pl.u > 1) {
        pl.u = 0;
        pl.edge = Math.floor(data.rnd() * data.edges.length);
      }
      const [a, b] = data.edges[pl.edge];
      tmpA.copy(objects.pos[a]).lerp(objects.pos[b], pl.u);
      tmpB.copy(objects.pos[a]).multiplyScalar(pl.u);
      tmpA.lerp(tmpB, live.outward);
      pp.setXYZ(i, tmpA.x, tmpA.y, tmpA.z);
    });
    pp.needsUpdate = true;

    // materials
    const dim = p.dim;
    mats.node.color.copy(live.accent).lerp(WHITE, 0.65);
    mats.netLine.color.copy(live.accent).lerp(live.primary, 0.3);
    mats.netLine.opacity = clamp(0.5 * p.lines * live.lineBoost * (1 + nf * 0.9 + live.focus.lattice * 0.3), 0, 1) * dim;
    const hu = objects.haloMat.uniforms;
    hu.uColorA.value.copy(live.accent);
    hu.uColorB.value.copy(live.primary).lerp(WHITE, 0.3);
    hu.uOpacity.value = (0.55 + nf * 0.5) * dim;
    const pu = objects.pulseMat.uniforms;
    pu.uColorA.value.copy(WHITE);
    pu.uColorB.value.copy(live.accent);
    pu.uOpacity.value = (0.5 + p.energy * 0.6) * dim;
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, N]} material={mats.node} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 12]} />
      </instancedMesh>
      <lineSegments geometry={objects.lineGeo} material={mats.netLine} frustumCulled={false} />
      <points geometry={objects.haloGeo} material={objects.haloMat} frustumCulled={false} />
      <points geometry={objects.pulseGeo} material={objects.pulseMat} frustumCulled={false} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Mode-change shock ring                                                     */
/* -------------------------------------------------------------------------- */

function ShockRing({ mats }: { mats: CoreMaterials }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const b = live.burst;
    mats.shock.opacity = b * 0.7 * live.pose.dim;
    mats.shock.color.copy(live.accent);
    if (ref.current) {
      const s = 0.9 + (1 - b) * 3.2;
      ref.current.scale.set(s, s, s);
      ref.current.visible = b > 0.01;
    }
  });
  return (
    <Billboard>
      <mesh ref={ref} material={mats.shock} visible={false}>
        <ringGeometry args={[0.985, 1, 96]} />
      </mesh>
    </Billboard>
  );
}

/* -------------------------------------------------------------------------- */
/* Assembly                                                                   */
/* -------------------------------------------------------------------------- */

export interface CoreRigProps {
  quality: Quality;
  /** Optional Blender-exported structure that replaces the procedural lattice, rings and strata. */
  structure?: React.ReactNode;
}

export default function CoreRig({ quality, structure }: CoreRigProps) {
  const group = useRef<THREE.Group>(null);
  const mats = useMemo(() => createCoreMaterials(), []);
  useEffect(() => () => mats.dispose(), [mats]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = live.pose;
    const t = live.time;
    const float = Math.sin(t * 0.5) * 0.06;
    g.position.set(p.x, p.y + float, 0);
    g.scale.setScalar(p.scale);
    g.rotation.y = p.yaw + t * 0.1 + live.pointer.x * 0.45;
    g.rotation.x = p.pitch - live.pointer.y * 0.28 + Math.sin(t * 0.3) * 0.04;
    g.rotation.z = p.roll + Math.sin(t * 0.21) * 0.05;
  });

  return (
    <group ref={group}>
      <Halo mats={mats} />
      <Nucleus mats={mats} quality={quality} />
      {structure ?? (
        <>
          <Strata mats={mats} quality={quality} />
          <Lattice mats={mats} />
          <Rings mats={mats} quality={quality} />
        </>
      )}
      <NeuralNet mats={mats} quality={quality} />
      <OrbitDust quality={quality} />
      <ShockRing mats={mats} />
    </group>
  );
}
