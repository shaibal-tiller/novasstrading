import { redirect } from "next/navigation";
import { getAdminSession, hasModule } from "@/lib/admin-session";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminContentLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login?next=" + encodeURIComponent("/admin/content"));
  }
  if (!hasModule(session, "website")) {
    redirect("/admin");
  }

  return (
    <div className="relative z-10 min-h-screen bg-canvas">
      <AdminHeader session={session} active="website" />
      <div className="px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
