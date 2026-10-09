import type { partners as PartnersContent } from "@/lib/content";
import { Editable } from "./admin/Editable";
import { ContentMedia } from "./ContentMedia";

const MASK = {
  maskImage:
    "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)",
  WebkitMaskImage:
    "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)",
} as const;

export function Partners({ partners }: { partners: typeof PartnersContent }) {
  // Local item-id widening: DB rows carry a numeric `id`; the static content
  // type doesn't. See Task 8 brief — `id` is `undefined` at runtime here,
  // which is safe since Editable never reads it outside edit mode.
  type LogoWithId = (typeof partners.logos)[number] & { id: number };
  type MembershipWithId = (typeof partners.memberships)[number] & { id: number };
  const logos = partners.logos as LogoWithId[];
  const memberships = partners.memberships as MembershipWithId[];

  // Repeat the logo set so the marquee loop stays dense.
  const strip = Array.from({ length: 4 }, () => logos).flat();
  const loop = [...strip, ...strip];

  return (
    <section id="partners" className="section-wrap">
      <div className="section-card section-card--cream overflow-hidden">
        <div className="max-w-2xl">
          <p className="eyebrow">
            <Editable id="partners.eyebrow" kind="text">{partners.eyebrow}</Editable>
          </p>
          <h2 className="display-lg mt-5 text-ink">
            <Editable id="partners.title" kind="text">{partners.title}</Editable>
          </h2>
          <p className="lede mt-5">
            <Editable id="partners.intro" kind="text">{partners.intro}</Editable>
          </p>
        </div>

        {/* Desktop / tablet: single strip */}
        <div className="relative mt-12 hidden sm:flex" style={MASK}>
          <ul
            className="flex shrink-0 animate-marquee items-center gap-4 pr-4"
            aria-label="Client brands"
          >
            {loop.map((logo, i) => (
              <li
                key={`${logo.name}-${i}`}
                aria-hidden={i >= strip.length}
                className="grid h-24 w-44 flex-shrink-0 place-items-center rounded-2xl border border-ink/10 bg-canvas px-6"
              >
                <Editable id={`partners.logos.${logo.id}`} kind="item" as="div" className="contents">
                  <ContentMedia
                    src={logo.src}
                    alt={i < strip.length ? `${logo.name} logo` : ""}
                    kind="logo"
                    aspect="aspect-[132/56]"
                    className="max-h-14"
                    fit="contain"
                  />
                </Editable>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile: two smaller strips scrolling in opposite directions */}
        <div className="mt-8 space-y-3 sm:hidden" aria-label="Client brands">
          {(["animate-marquee", "animate-marquee-reverse"] as const).map((anim) => (
            <div key={anim} className="relative flex" style={MASK}>
              <ul className={`flex shrink-0 items-center gap-3 pr-3 ${anim}`}>
                {loop.map((logo, i) => (
                  <li
                    key={`${anim}-${logo.name}-${i}`}
                    aria-hidden
                    className="grid h-16 w-28 flex-shrink-0 place-items-center rounded-xl border border-ink/10 bg-canvas px-4"
                  >
                    <Editable id={`partners.logos.${logo.id}`} kind="item" as="div" className="contents">
                      <ContentMedia
                        src={logo.src}
                        alt=""
                        kind="logo"
                        aspect="aspect-[96/40]"
                        className="max-h-9"
                        fit="contain"
                      />
                    </Editable>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-ink/10 pt-8">
          <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-loom">
            Memberships
          </h3>
          <ul className="mt-5 flex flex-wrap items-center gap-4">
            {memberships.map((m) => (
              <li
                key={m.name}
                className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-canvas px-5 py-3"
              >
                <Editable id={`partners.memberships.${m.id}`} kind="item" as="div" className="contents">
                  <div className="h-10 w-[72px] flex-shrink-0">
                    <ContentMedia
                      src={m.src}
                      alt={`${m.name} membership logo`}
                      kind="logo"
                      aspect="aspect-[72/40]"
                      className="max-h-10"
                      fit="contain"
                    />
                  </div>
                  <span className="font-display text-base font-semibold text-ink/80">
                    {m.name}
                  </span>
                </Editable>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

