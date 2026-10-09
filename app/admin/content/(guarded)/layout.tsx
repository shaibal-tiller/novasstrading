import { redirect } from "next/navigation";
import { requestedAdminPath } from "@/lib/admin-request-path";
import { getAdminSession, hasModule } from "@/lib/admin-session";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminContentLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login?next=" + encodeURIComponent(requestedAdminPath("/admin/content")));
  }
  if (!hasModule(session, "website")) {
    redirect("/admin");
  }

  return (
    <div className="relative z-10 min-h-screen bg-canvas">
      <AdminHeader session={session} active="website" />
      {/* Same width and side padding as the dashboard (the door layout) so pages line up when switching. */}
      <div className="mx-auto max-w-shell px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
