"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { sceneState } from "@/lib/sceneState";
import { siteConfig } from "@/lib/config";
import CoreRig from "./CoreRig";
import ErrorBoundary from "./ErrorBoundary";
import GlbStructure, { useGlbAvailable } from "./GlbStructure";
import { StarField } from "./Particles";
import { stepLive, live } from "./live";
import { getQuality, type Quality } from "./quality";

/** Per-frame driver: updates shared state once, then moves camera + lights. */
function Director({ onReady }: { onReady: () => void }) {
  const camera = useThree((s) => s.camera);
  const keyA = useRef<THREE.PointLight>(null);
  const keyB = useRef<THREE.PointLight>(null);
  const frames = useRef(0);

  useFrame((_, dt) => {
    stepLive(dt);
    const p = live.pose;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, live.pointer.x * 0.28, 3, Math.min(dt, 0.05));
    camera.position.y = THREE.MathUtils.damp(camera.position.y, -live.pointer.y * 0.18, 3, Math.min(dt, 0.05));
    camera.position.z = p.camZ;
    camera.lookAt(0, 0, 0);

    const e = 0.4 + p.energy * 0.6;
    if (keyA.current) {
      keyA.current.color.copy(live.primary);
      keyA.current.intensity = 70 * e * (0.4 + 0.6 * p.dim);
    }
    if (keyB.current) {
      keyB.current.color.copy(live.accent);
      keyB.current.intensity = 55 * e * (0.4 + 0.6 * p.dim);
    }

    if (frames.current < 4 && ++frames.current === 4) {
      sceneState.ready = true;
      onReady();
    }
  }, -1);

  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight ref={keyA} position={[-4, 2.5, 4]} distance={24} decay={2} />
      <pointLight ref={keyB} position={[4.5, -1.5, 3]} distance={24} decay={2} />
    </>
  );
}

function Studio() {
  return (
    <Environment resolution={128} frames={1} background={false}>
      <Lightformer form="rect" intensity={5} color="#7857ff" position={[-5, 2, -3]} scale={[9, 3, 1]} rotation-y={Math.PI / 2} />
      <Lightformer form="rect" intensity={4} color="#59e7ff" position={[5, -1, -2]} scale={[8, 2.2, 1]} rotation-y={-Math.PI / 2} />
      <Lightformer form="ring" intensity={2.5} color="#f4f5ff" position={[0, 5, 2]} scale={4} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" intensity={1.6} color="#b9acff" position={[0, -4, 3]} scale={[8, 1.4, 1]} rotation-x={-Math.PI / 2} />
      <Lightformer form="circle" intensity={1.2} color="#ffffff" position={[0, 1, -6]} scale={5} />
    </Environment>
  );
}

/** Core + optional GLB structure, with a safe fallback to the procedural one. */
function Core({ quality }: { quality: Quality }) {
  const glb = useGlbAvailable();
  const procedural = <CoreRig quality={quality} />;
  if (!glb) return procedural;
  return (
    <ErrorBoundary fallback={procedural}>
      <Suspense fallback={procedural}>
        <CoreRig quality={quality} structure={<GlbStructure url={siteConfig.glbPath} />} />
      </Suspense>
    </ErrorBoundary>
  );
}

export interface SceneProps {
  onReady: () => void;
  onFail: () => void;
}

export default function Scene({ onReady, onFail }: SceneProps) {
  const quality = useMemo(() => getQuality(), []);

  // pointer drives subtle rotation / camera parallax (window-level so the canvas can stay non-interactive)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const leave = () => {
      sceneState.pointer.x = 0;
      sceneState.pointer.y = 0;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <ErrorBoundary fallback={null} onError={onFail}>
      <Canvas
        dpr={quality.dpr}
        camera={{ position: [0, 0, 7], fov: 40, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => {
              e.preventDefault();
              onFail();
            },
            { once: true }
          );
        }}
        aria-hidden="true"
      >
        <Director onReady={onReady} />
        <Studio />
        <StarField quality={quality} />
        <Core quality={quality} />
      </Canvas>
    </ErrorBoundary>
  );
}
