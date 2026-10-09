import Image from "next/image";
import { MODULE_LINKS, type AdminDestination } from "@/lib/admin-redirect";
import { displayNameFor, initialsFor } from "@/lib/admin-profile";
import { hasModule, type AdminSession } from "@/lib/admin-session";
import { AdminIcon, type AdminIconName } from "./AdminIcon";
import { GuardedAnchor, GuardedLink } from "./GuardedLink";
import { ProfileMenu } from "./ProfileMenu";
import { SignOutButton } from "./SignOutButton";

export type AdminArea = "home" | AdminDestination;

const AREA_ICONS: Record<AdminArea, AdminIconName> = {
  home: "home",
  website: "globe",
  analytics: "chart",
  assets: "box",
};

const TABS: AdminArea[] = ["home", "website", "analytics", "assets"];

/**
 * The header shared by every admin screen: the same logo and name as the public website, tabs for
 * the areas this person may open, then the profile button and Sign out. Without a session (the
 * sign-in page) it shows only the brand.
 */
export function AdminHeader({ session, active }: { session: AdminSession | null; active?: AdminArea }) {
  const tabs = session
    ? TABS.filter((t) => t === "home" || hasModule(session, MODULE_LINKS[t].module))
    : [];

  return (
    <header className="border-b border-ink/10 bg-ivory/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-shell flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        <GuardedLink
          href={session ? "/admin" : "/admin/login"}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="Nova SS Trading admin home"
        >
          <Image src="/logo.png" alt="" width={48} height={48} className="h-11 w-auto object-contain" priority />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              NOVA SS<span className="text-brass">.</span>
            </span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ink-muted">Trading</span>
          </span>
          <span className="ml-1 hidden rounded-full border border-brass/40 bg-brass/10 px-2.5 py-0.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-[#6b5128] sm:inline">
            Admin
          </span>
        </GuardedLink>

        {session && (
          <div className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1 md:justify-center">
            {/* On phones the tabs share the row evenly (icons hidden) so none is cut off; it still scrolls as a fallback. */}
            <nav aria-label="Admin areas" className="flex w-full gap-1 md:w-auto">
              {tabs.map((t) => {
                const isActive = t === active;
                const href = t === "home" ? "/admin" : MODULE_LINKS[t].href;
                const label = t === "home" ? "Dashboard" : MODULE_LINKS[t].label;
                const cls = `inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-2.5 py-2 text-[0.82rem] sm:flex-none sm:px-4 font-semibold transition-colors ${
                  isActive ? "bg-ink text-ivory" : "text-ink/80 hover:bg-brass/10 hover:text-brass-dark"
                }`;
                const inner = (
                  <>
                    <AdminIcon name={AREA_ICONS[t]} className="hidden h-4 w-4 sm:block" />
                    {label}
                  </>
                );
                // Assets is a separate app behind a rewrite: it needs a full page load.
                return t === "assets" ? (
                  <GuardedAnchor key={t} href={href} className={cls} aria-current={isActive ? "page" : undefined}>
                    {inner}
                  </GuardedAnchor>
                ) : (
                  <GuardedLink key={t} href={href} className={cls} aria-current={isActive ? "page" : undefined}>
                    {inner}
                  </GuardedLink>
                );
              })}
            </nav>
          </div>
        )}

        {session && (
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-[0.8rem] font-semibold text-ink/70 transition-colors hover:text-brass-dark lg:inline-flex"
            >
              View site
              <AdminIcon name="external" className="h-3.5 w-3.5" />
            </a>
            <ProfileMenu
              name={displayNameFor(session.email)}
              initials={initialsFor(session.email)}
              email={session.email}
              roleLabel={session.role === "admin" ? "Administrator" : "Viewer"}
              access={[
                ...(hasModule(session, "website") ? ["Website", "Analytics"] : []),
                ...(hasModule(session, "assets") ? ["Assets"] : []),
              ]}
            />
            <SignOutButton className="btn btn-outline hidden !px-4 !py-2 text-xs sm:inline-flex" />
          </div>
        )}
      </div>
    </header>
  );
}
