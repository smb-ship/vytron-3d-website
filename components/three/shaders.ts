import * as THREE from "three";

export const nucleusVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vP = position;
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const nucleusFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uA;
uniform vec3 uB;
uniform float uEnergy;
varying vec3 vN;
varying vec3 vP;
varying vec3 vV;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float ndv = max(dot(n, v), 0.0);
  float fres = pow(1.0 - ndv, 2.2);
  float f = noise(vP * 3.2 + vec3(0.0, uTime * 0.35, uTime * 0.2));
  f += 0.5 * noise(vP * 6.5 - vec3(uTime * 0.25));
  f /= 1.5;
  vec3 col = mix(uA, uB, smoothstep(0.25, 0.85, f));
  float body = 0.5 + 0.5 * f;
  vec3 c = col * body * (0.8 + uEnergy * 1.0);
  c += uB * fres * 1.5 * uEnergy;
  c += vec3(1.0) * pow(ndv, 6.0) * 0.4 * uEnergy;
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = exp(-d * d * 4.2) * 0.9 + exp(-d * 2.2) * 0.12;
  a *= smoothstep(1.0, 0.7, d);
  gl_FragColor = vec4(uColor * a * uOpacity, a * uOpacity);
  #include <colorspace_fragment>
}
`;

const pointsVertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uSize;
uniform float uPR;
uniform float uScroll;
varying float vA;
varying float vMix;
void main() {
  vec3 p = position;
  #ifdef DRIFT
    p.x += sin(uTime * 0.07 * (1.0 + aSeed) + aSeed * 40.0) * 0.6;
    p.y += cos(uTime * 0.05 * (1.0 + aSeed) + aSeed * 30.0) * 0.5 + uScroll * (0.4 + aSeed * 1.6);
    p.y = mod(p.y + 9.0, 18.0) - 9.0;
  #endif
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depthScale = 8.0 / max(0.1, -mv.z);
  gl_PointSize = max(1.0, uSize * uPR * (0.35 + aSeed) * depthScale);
  vA = 0.2 + 0.8 * aSeed;
  vMix = aSeed;
}
`;

const pointsFragment = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
varying float vA;
varying float vMix;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  vec3 c = mix(uColorA, uColorB, vMix);
  gl_FragColor = vec4(c, a * vA * uOpacity);
  #include <colorspace_fragment>
}
`;

export function makePointsMaterial(opts: { drift: boolean; size: number; pixelRatio: number }) {
  return new THREE.ShaderMaterial({
    vertexShader: pointsVertex,
    fragmentShader: pointsFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    defines: opts.drift ? { DRIFT: "" } : {},
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: opts.size },
      uPR: { value: opts.pixelRatio },
      uScroll: { value: 0 },
      uColorA: { value: new THREE.Color("#b9acff") },
      uColorB: { value: new THREE.Color("#59e7ff") },
      uOpacity: { value: 1 },
    },
  });
}
