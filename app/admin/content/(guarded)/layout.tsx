import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, hasModule } from "@/lib/admin-session";
import { SignOutButton } from "@/components/admin/SignOutButton";

export default async function AdminContentLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login?next=" + encodeURIComponent("/admin/content"));
  }
  if (!hasModule(session, "website")) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <nav className="flex flex-wrap items-center gap-6 border-b border-ink/10 px-6 py-4">
        <span className="field-label">Nova SS Trading — Content</span>
        <Link href="/admin" className="field-label hover:text-brass-dark">
          Admin home
        </Link>
        <span className="ml-auto flex items-center gap-4">
          <span className="text-xs text-ink-muted">{session.email}</span>
          <SignOutButton className="btn btn-outline text-xs" />
        </span>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
