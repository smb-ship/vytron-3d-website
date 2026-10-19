/**
 * Site configuration. Everything here is optional and driven by environment
 * variables so no fake contact details or social profiles ship with the project.
 * See `.env.example` and README.md → "Contact form".
 */
export const siteConfig = {
  name: "VYTRON",
  tagline: "INTELLIGENCE. REIMAGINED.",
  description:
    "VYTRON is a fictional next-generation AI brand: an immersive 3D landing page concept built with Next.js, React Three Fiber and GSAP.",
  /** Where mailto: fallback messages are addressed. Leave empty to disable. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "",
  /** Optional form endpoint (Formspree, Getform, your own API route…). */
  formEndpoint: process.env.NEXT_PUBLIC_FORM_ENDPOINT?.trim() ?? "",
  /** Only socials with a configured URL are rendered. */
  socials: [
    { label: "LinkedIn", href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN?.trim() ?? "" },
    { label: "GitHub", href: process.env.NEXT_PUBLIC_SOCIAL_GITHUB?.trim() ?? "" },
    { label: "Instagram", href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() ?? "" },
    { label: "X", href: process.env.NEXT_PUBLIC_SOCIAL_X?.trim() ?? "" },
  ].filter((s) => /^https?:\/\//.test(s.href)),
  /** Path of the optional Blender-exported model. */
  glbPath: "/models/vytron-core.glb",
} as const;

export const navLinks = [
  { id: "dimension", label: "Vision" },
  { id: "core", label: "Core" },
  { id: "capabilities", label: "Capabilities" },
  { id: "process", label: "Process" },
  { id: "explorer", label: "Explorer" },
] as const;
