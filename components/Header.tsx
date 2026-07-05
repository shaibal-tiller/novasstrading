"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { nav, site } from "@/lib/content";
import { clsx } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track which section is currently in view
  useEffect(() => {
    const sectionIds = nav.map((item) => item.href.replace("#", ""));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const handleScroll = () => {
      let currentActive = "";
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 120) {
          currentActive = `#${section.id}`;
        }
      }
      if (currentActive) {
        setActiveSection(currentActive);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled || open
          ? "bg-card/95 shadow-[0_1px_20px_-6px_rgba(0,0,0,0.08)] backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="shell flex h-[4.5rem] items-center justify-between">
        {/* Logo */}
        <a
          href="#home"
          className="flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-80"
          aria-label={`${site.name} home`}
        >
          <Image
            src="/logo.png"
            alt={`${site.name} logo`}
            width={44}
            height={44}
            className="h-10 w-auto object-contain"
            priority
          />
          <div className="flex flex-col leading-none">
            <span className="font-sans text-[0.95rem] font-bold tracking-tight text-ink">
              NOVA SS<span className="text-accent">.</span>
            </span>
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.3em] text-ink-muted">
              Trading
            </span>
          </div>
        </a>

        {/* Desktop navigation */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 lg:flex"
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={clsx(
                "font-sans text-[0.72rem] font-bold uppercase tracking-[0.08em] transition-colors duration-300",
                activeSection === item.href
                  ? "text-accent"
                  : "text-ink/80 hover:text-accent",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="relative z-50 grid h-10 w-10 place-items-center lg:hidden"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-[5px]">
            <span
              className={clsx(
                "h-[2px] w-6 bg-ink transition-transform duration-300",
                open && "translate-y-[7px] rotate-45",
              )}
            />
            <span
              className={clsx(
                "h-[2px] w-6 bg-ink transition-opacity duration-300",
                open && "opacity-0",
              )}
            />
            <span
              className={clsx(
                "h-[2px] w-6 bg-ink transition-transform duration-300",
                open && "-translate-y-[7px] -rotate-45",
              )}
            />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={clsx("lg:hidden", open ? "block" : "hidden")}
      >
        <nav
          aria-label="Mobile"
          className="shell flex flex-col gap-1 border-t border-ink/10 bg-card pb-8 pt-4"
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "border-b border-ink/5 py-3 font-sans text-lg font-medium transition-colors duration-300",
                activeSection === item.href
                  ? "border-l-2 border-l-accent pl-3 text-accent-dark"
                  : "text-ink",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
