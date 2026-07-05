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
        // 120px offset accounts for the fixed header
        if (rect.top <= 120) {
          currentActive = `#${section.id}`;
        }
      }

      if (currentActive) {
        setActiveSection(currentActive);
      } else if (window.scrollY === 0 && sections.length > 0) {
        setActiveSection(`#${sections[0].id}`);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initialize

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Scoped styles for nav link hover animation */}
      <style jsx>{`
        .nav-link {
          position: relative;
          display: inline-block;
          padding-bottom: 3px;
        }
        .nav-link::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #B08A4F, #C6A268);
          border-radius: 1px;
          transition: width 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .nav-link:hover::after,
        .nav-link-active::after {
          width: 100%;
        }
        .nav-link:hover,
        .nav-link-active {
          color: #B08A4F;
        }
      `}</style>

      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled || open
            ? "border-b border-ink/10 bg-ivory/95 shadow-[0_1px_20px_-6px_rgba(22,25,31,0.1)] backdrop-blur-xl"
            : "border-b border-stone/30 bg-ivory/40 backdrop-blur-sm",
        )}
      >
        <div className="shell flex h-[4.75rem] items-center justify-between">
          {/* Logo */}
          <a
            href="#home"
            className="flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-80"
            aria-label={`${site.name} home`}
          >
            <Image
              src="/logo.png"
              alt={`${site.name} logo`}
              width={48}
              height={48}
              className="h-11 w-auto object-contain"
              priority
            />
            <div className="flex flex-col leading-none">
              <span className="font-display text-[1.05rem] font-semibold tracking-tight text-ink">
                NOVA SS<span className="text-brass">.</span>
              </span>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-ink-muted">
                Trading
              </span>
            </div>
          </a>

          {/* Desktop navigation */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 lg:flex"
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={clsx(
                  "nav-link font-sans text-[0.82rem] font-semibold uppercase tracking-[0.06em] text-ink/90 transition-colors duration-300",
                  activeSection === item.href && "nav-link-active",
                )}
              >
                {item.label}
              </a>
            ))}
            <a href="#contact" className="btn btn-primary !py-2.5 !px-5 text-xs">
              Inquire now
            </a>
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
          className={clsx(
            "lg:hidden",
            open ? "block" : "hidden",
          )}
        >
          <nav
            aria-label="Mobile"
            className="shell flex flex-col gap-1 border-t border-ink/10 bg-ivory pb-8 pt-4"
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "border-b border-ink/5 py-3 font-display text-xl transition-colors duration-300",
                  activeSection === item.href
                    ? "border-l-2 border-l-brass pl-3 text-brass-dark"
                    : "text-ink",
                )}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="btn btn-primary mt-4"
            >
              Inquire now
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}
