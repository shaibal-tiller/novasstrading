import Link from "next/link";
import { AdminIcon, type AdminIconName } from "./AdminIcon";

/** A clickable card used across the admin screens (editor sections, tools). */
export function AdminCard({
  href,
  icon,
  title,
  description,
  cta = "Edit",
  number,
  dark = false,
}: {
  href: string;
  icon: AdminIconName;
  title: string;
  description: string;
  cta?: string;
  /** Position badge, e.g. the section's place on the page. */
  number?: number;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border p-5 shadow-[0_1px_2px_rgba(22,25,31,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(22,25,31,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/50 ${
        dark ? "border-ink bg-ink text-ivory" : "border-ink/10 bg-white text-ink hover:border-brass"
      }`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl ${
            dark ? "bg-brass text-ink" : "bg-brass/10 text-brass-dark"
          }`}
        >
          <AdminIcon name={icon} className="h-5 w-5" />
        </span>
        {number !== undefined && (
          <span className={`font-mono text-[0.7rem] tracking-[0.18em] ${dark ? "text-ivory/50" : "text-ink-muted/60"}`}>
            {String(number).padStart(2, "0")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-display text-lg font-medium leading-tight">{title}</h3>
        <p className={`text-sm leading-relaxed ${dark ? "text-ivory/70" : "text-ink-muted"}`}>{description}</p>
      </div>
      <span
        className={`inline-flex items-center gap-1.5 text-[0.8rem] font-semibold ${
          dark ? "text-brass-light" : "text-brass-dark"
        }`}
      >
        {cta}
        <AdminIcon name="arrow" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
