import { existsSync } from "node:fs";

// The Blender-exported GLB is optional. Detect it at build time so the browser
// never has to probe for a file that does not exist.
const hasGlb = existsSync(new URL("./public/models/vytron-core.glb", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  env: { NEXT_PUBLIC_HAS_GLB: hasGlb ? "1" : "" },
};
export default nextConfig;
