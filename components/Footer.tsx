import { footerBlurb, nav, site } from "@/lib/content";
import { SectionParticles } from "./SectionParticles";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ivory-deep text-ink section-card--particled">
      <SectionParticles seed={14} count={8} />
      <div className="shell py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1.2fr]">
          <div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-semibold tracking-tight">
                NOVA SS<span className="text-brass">.</span>
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ink-muted">
                Trading
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
              {footerBlurb}
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass-dark">
              Quick links
            </h2>
            <ul className="mt-4 space-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-ink/70 transition-colors hover:text-brass-dark"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass-dark">
              Contact info
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink/70">
              <li>
                <a
                  href={`tel:${site.phoneHref}`}
                  className="transition-colors hover:text-brass-dark"
                >
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="transition-colors hover:text-brass-dark"
                >
                  {site.email}
                </a>
              </li>
              <li className="max-w-xs leading-relaxed">{site.address.full}</li>
            </ul>
          </div>
        </div>

        <hr className="stitch my-10" />

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <div className="flex gap-3">
            <a
              href={site.social.linkedin}
              aria-label="LinkedIn"
              className="grid h-9 w-9 place-items-center rounded-full border border-ink/20 text-ink/70 transition-colors hover:border-brass hover:text-brass-dark"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.98 3.5A2.5 2.5 0 002.5 6 2.5 2.5 0 005 8.5 2.5 2.5 0 007.5 6 2.5 2.5 0 004.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.65 21 11 21 14v7h-4v-6.2c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21H9z" />
              </svg>
            </a>
            <a
              href={site.social.instagram}
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-full border border-ink/20 text-ink/70 transition-colors hover:border-brass hover:text-brass-dark"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
