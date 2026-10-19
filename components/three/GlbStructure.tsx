"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { live } from "./live";

/**
 * Renders the Blender-exported structure (rings, cage, glass shells).
 * Naming contract with scripts/create_vytron_core.py:
 *   Ring_##            → spun around their own local axis here
 *   Core_Nucleus*      → hidden (the live shader nucleus is used instead)
 *   Node_* / Link_*    → hidden (the live neural network is used instead)
 */
export default function GlbStructure({ url }: { url: string }) {
  const gltf = useGLTF(url);

  const { root, rings, mats } = useMemo(() => {
    const root = gltf.scene.clone(true);
    const rings: THREE.Object3D[] = [];
    const mats = new Map<THREE.Material, { env: number; opacity: number }>();
    root.traverse((o) => {
      if (/^(Core_Nucleus|Node_|Link_)/.test(o.name)) {
        o.visible = false;
        return;
      }
      if (/^Ring_/.test(o.name)) rings.push(o);
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        list.forEach((m) => {
          const std = m as THREE.MeshStandardMaterial;
          mats.set(m, { env: std.envMapIntensity ?? 1, opacity: m.opacity });
        });
      }
    });
    return { root, rings, mats };
  }, [gltf]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    rings.forEach((r, i) => r.rotateY(d * 0.16 * (i % 2 ? -1 : 1) * (1 + i * 0.12) * live.ringSpeed));
    const dim = live.pose.dim;
    mats.forEach((base, m) => {
      const std = m as THREE.MeshStandardMaterial;
      if ("envMapIntensity" in std) std.envMapIntensity = base.env * (0.45 + 0.9 * dim);
      if (m.transparent) m.opacity = base.opacity * (0.4 + 0.6 * dim);
    });
  });

  return <primitive object={root} />;
}

/**
 * Whether the optional GLB shipped with this build. The flag is set at build
 * time by next.config.mjs (it checks public/models/vytron-core.glb), so there
 * is no failing network probe when the file is absent.
 */
export function useGlbAvailable(): boolean {
  return process.env.NEXT_PUBLIC_HAS_GLB === "1";
}
