import { footerBlurb, nav, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="bg-ivory-deep text-ink">
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
                  href={site.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-brass-dark"
                >
                  <WhatsAppIcon />
                  WhatsApp
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
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${site.name} on LinkedIn`}
              className="grid h-9 w-9 place-items-center rounded-full border border-ink/20 text-ink/70 transition-colors hover:border-brass hover:text-brass-dark"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.98 3.5A2.5 2.5 0 002.5 6 2.5 2.5 0 005 8.5 2.5 2.5 0 007.5 6 2.5 2.5 0 004.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.65 21 11 21 14v7h-4v-6.2c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21H9z" />
              </svg>
            </a>
            <a
              href={site.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Message ${site.name} on WhatsApp`}
              className="grid h-9 w-9 place-items-center rounded-full border border-ink/20 text-ink/70 transition-colors hover:border-brass hover:text-brass-dark"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24a8.19 8.19 0 015.82 2.42 8.18 8.18 0 012.41 5.83c0 4.54-3.69 8.23-8.24 8.23zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.65 4.2 3.71.59.25 1.04.4 1.4.52.59.18 1.12.16 1.54.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29z" />
    </svg>
  );
}
