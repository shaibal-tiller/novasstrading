import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { MODULE_LINKS, chooserDecision, type AdminDestination } from "@/lib/admin-redirect";
import { displayNameFor } from "@/lib/admin-profile";
import type { AdminIconName } from "@/components/admin/AdminIcon";
import { ModuleCard } from "./ModuleCard";

export const dynamic = "force-dynamic";

const ICONS: Record<AdminDestination, AdminIconName> = {
  website: "globe",
  analytics: "chart",
  assets: "box",
};

export default async function AdminHomePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const decision = chooserDecision(session.modules);
  if (decision.kind === "redirect") redirect(decision.href);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Admin</span>
        <h1 className="display-lg text-ink">Welcome back, {displayNameFor(session.email)}</h1>
        <p className="lede max-w-2xl">Choose where you want to work today.</p>
      </div>

      {decision.kind === "none" ? (
        <p className="lede">
          Your account does not have access to any admin area yet. Ask an administrator to grant you access, then
          sign in again.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {decision.destinations.map((d, i) => {
            const link = MODULE_LINKS[d];
            return (
              <li key={d}>
                <ModuleCard href={link.href} label={link.label} blurb={link.blurb} icon={ICONS[d]} primary={i === 0} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
