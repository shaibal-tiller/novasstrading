import { profiles } from "@/lib/content";
import { Reveal } from "./Reveal";
import { SectionParticles } from "./SectionParticles";

export function Profiles() {
  return (
    <section id="profiles" className="section-wrap">
      <div className="section-card section-card--light section-card--particled">
        <SectionParticles seed={12} />
        <div className="max-w-2xl">
          <p className="eyebrow">{profiles.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{profiles.title}</h2>
          <p className="lede mt-5">{profiles.intro}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {profiles.documents.map((doc, i) => (
            <Reveal
              key={doc.title}
              as="article"
              delay={i * 80}
              className="group flex flex-col rounded-sm border border-ink/10 bg-canvas p-7 transition-colors hover:border-brass/50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-sm bg-ink text-ivory">
                <DocIcon />
              </span>
              <h3 className="mt-5 font-display text-xl font-medium text-ink">
                {doc.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                {doc.body}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary !py-2.5 !px-4 text-xs"
                >
                  View PDF
                </a>
                <a
                  href={doc.href}
                  download
                  className="btn btn-outline !py-2.5 !px-4 text-xs"
                >
                  Download
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
