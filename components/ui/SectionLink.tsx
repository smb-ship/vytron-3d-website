"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { scrollToSection } from "@/lib/navigate";

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
}

/** Anchor that eases to a section with GSAP (instant under prefers-reduced-motion). */
export default function SectionLink({ to, onClick, children, ...rest }: Props) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    scrollToSection(to);
  };
  return (
    <a href={`#${to}`} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
