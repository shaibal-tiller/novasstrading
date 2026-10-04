import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { MODULE_LINKS, chooserDecision } from "@/lib/admin-redirect";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { ModuleCard } from "./ModuleCard";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const decision = chooserDecision(session.modules);
  if (decision.kind === "redirect") redirect(decision.href);

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="display-md text-ink">Admin</h1>
        <p className="text-sm text-ink-muted">
          Signed in as <span className="font-medium text-ink">{session.email}</span>
        </p>
      </div>

      {decision.kind === "none" ? (
        <p className="lede">
          Your account does not have access to any admin area yet. Ask an administrator to grant you access, then
          sign in again.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {decision.modules.map((m, i) => {
            const link = MODULE_LINKS[m];
            return (
              <li key={m}>
                <ModuleCard href={link.href} label={link.label} blurb={link.blurb} primary={i === 0} />
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <SignOutButton />
      </div>
    </>
  );
}
