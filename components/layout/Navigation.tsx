"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/config";
import { scrollToSection } from "@/lib/navigate";
import Wordmark from "@/components/ui/Wordmark";

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [active, setActive] = useState<string>("");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // glass bar after leaving the top
  useEffect(() => {
    const onScroll = () => setSolid((prev) => {
      const next = window.scrollY > 40;
      return prev === next ? prev : next;
    });
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // active section marker
  useEffect(() => {
    const ids = [...navLinks.map((l) => l.id), "contact"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // mobile menu: scroll lock, escape, focus management
  useEffect(() => {
    document.body.classList.toggle("is-locked", open);
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const f = [...panelRef.current.querySelectorAll<HTMLElement>("a,button")];
        f.push(toggleRef.current!);
        const idx = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && idx <= 0) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && idx === f.length - 1) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("is-locked");
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const on = () => mq.matches && setOpen(false);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setOpen(false);
    window.setTimeout(() => scrollToSection(id), open ? 60 : 0);
  };

  return (
    <header className="nav" data-solid={solid || open}>
      <div className="nav-inner">
        <a
          href="#hero"
          className="nav-brand"
          aria-label="VYTRON — back to top"
          onClick={(e) => go(e, "hero")}
        >
          <Wordmark />
        </a>

        <nav className="nav-links" aria-label="Primary">
          {navLinks.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              aria-current={active === l.id ? "true" : undefined}
              onClick={(e) => go(e, l.id)}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a href="#contact" className="nav-cta btn btn-ghost" onClick={(e) => go(e, "contact")}>
          Contact
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      <div id="mobile-menu" ref={panelRef} className="mobile-menu" data-open={open} hidden={!open}>
        <nav aria-label="Mobile">
          {[...navLinks, { id: "contact", label: "Contact" }].map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={(e) => go(e, l.id)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
