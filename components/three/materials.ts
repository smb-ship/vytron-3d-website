import * as THREE from "three";
import { glowFragment, glowVertex, nucleusFragment, nucleusVertex } from "./shaders";

export interface CoreMaterials {
  chrome: THREE.MeshPhysicalMaterial;
  glass: THREE.MeshPhysicalMaterial;
  glassFacet: THREE.MeshPhysicalMaterial;
  glassRing: THREE.MeshPhysicalMaterial;
  glow: THREE.MeshBasicMaterial;
  cap: THREE.MeshBasicMaterial;
  lattice: THREE.LineBasicMaterial;
  latticeInner: THREE.LineBasicMaterial;
  node: THREE.MeshBasicMaterial;
  netLine: THREE.LineBasicMaterial;
  shock: THREE.MeshBasicMaterial;
  nucleus: THREE.ShaderMaterial;
  halo: THREE.ShaderMaterial;
  dispose: () => void;
}

export const CHROME_BASE = new THREE.Color("#dfe4ff");

export function createCoreMaterials(): CoreMaterials {
  const chrome = new THREE.MeshPhysicalMaterial({
    color: CHROME_BASE,
    metalness: 1,
    roughness: 0.14,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.4,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#b9acff"),
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.2,
    iridescence: 1,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [180, 520],
    envMapIntensity: 1.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const glassFacet = glass.clone();
  glassFacet.flatShading = true;
  glassFacet.opacity = 0.13;
  const glassRing = glass.clone();
  glassRing.opacity = 0.34;
  glassRing.roughness = 0.02;

  const glow = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#59e7ff"),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const cap = new THREE.MeshBasicMaterial({ color: new THREE.Color("#f4f5ff"), toneMapped: false });
  const lattice = new THREE.LineBasicMaterial({
    color: new THREE.Color("#b9acff"),
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const latticeInner = lattice.clone();
  latticeInner.opacity = 0.22;
  const node = new THREE.MeshBasicMaterial({ color: new THREE.Color("#f4f5ff"), toneMapped: false });
  const netLine = new THREE.LineBasicMaterial({
    color: new THREE.Color("#59e7ff"),
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const shock = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#59e7ff"),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const nucleus = new THREE.ShaderMaterial({
    vertexShader: nucleusVertex,
    fragmentShader: nucleusFragment,
    uniforms: {
      uTime: { value: 0 },
      uA: { value: new THREE.Color("#7857ff") },
      uB: { value: new THREE.Color("#59e7ff") },
      uEnergy: { value: 1 },
    },
  });
  const halo = new THREE.ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color("#7857ff") },
      uOpacity: { value: 1 },
    },
  });

  const all = [chrome, glass, glassFacet, glassRing, glow, cap, lattice, latticeInner, node, netLine, shock, nucleus, halo];
  return {
    chrome, glass, glassFacet, glassRing, glow, cap, lattice, latticeInner, node, netLine, shock, nucleus, halo,
    dispose: () => all.forEach((m) => m.dispose()),
  };
}
