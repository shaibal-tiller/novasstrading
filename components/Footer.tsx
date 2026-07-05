import { footerNav, site } from "@/lib/content";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-card text-ink pb-8">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-16 pt-20 pb-16">
          {/* Brand & Address */}
          <div>
            <a href="#home" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt={`${site.name} logo`}
                width={48}
                height={48}
                className="h-12 w-auto object-contain"
              />
              <div className="flex flex-col leading-none">
                <span className="font-sans text-lg font-bold tracking-tight text-ink">
                  NOVA SS<span className="text-accent">.</span>
                </span>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-ink-muted mt-1">
                  Trading
                </span>
              </div>
            </a>
            <p className="mt-8 max-w-xs text-sm leading-relaxed text-ink-muted">
              {site.description}
            </p>
            <div className="mt-8">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink">
                Headquarters
              </p>
              <p className="mt-2 text-sm text-ink-muted max-w-[200px] leading-relaxed">
                {site.address.street}<br />
                {site.address.city}, {site.address.country}
              </p>
            </div>
          </div>

          {/* Navigation Col 1 */}
          <nav aria-label="Footer Column 1">
            <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink">
              Links
            </h2>
            <ul className="mt-6 space-y-4">
              {footerNav.col1.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="font-sans text-sm font-medium text-ink-muted transition-colors hover:text-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Navigation Col 2 */}
          <nav aria-label="Footer Column 2">
            <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink opacity-0 hidden sm:block">
              More Links
            </h2>
            <ul className="sm:mt-6 space-y-4">
              {footerNav.col2.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="font-sans text-sm font-medium text-ink-muted transition-colors hover:text-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-ink/10 pt-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <p className="font-sans text-[0.65rem] uppercase tracking-widest text-ink-muted">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          
          <div className="flex gap-4">
            <a
              href={site.social.linkedin}
              aria-label="LinkedIn"
              className="grid h-10 w-10 place-items-center rounded-full border border-ink/20 text-ink/70 transition-all hover:border-accent hover:text-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.98 3.5A2.5 2.5 0 002.5 6 2.5 2.5 0 005 8.5 2.5 2.5 0 007.5 6 2.5 2.5 0 004.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.65 21 11 21 14v7h-4v-6.2c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21H9z" />
              </svg>
            </a>
            <a
              href={site.social.instagram}
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-ink/20 text-ink/70 transition-all hover:border-accent hover:text-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
