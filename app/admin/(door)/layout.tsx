import { getAdminSession } from "@/lib/admin-session";
import { AdminHeader } from "@/components/admin/AdminHeader";

/** Shell for the shared sign-in door (/admin/login) and the dashboard (/admin). */
export default async function AdminDoorLayout({ children }: { children: React.ReactNode }) {
  // Cached for a few seconds, so the page's own session check does not cost a second request.
  const session = await getAdminSession();
  return (
    <div className="relative z-10 min-h-screen bg-ivory-light">
      <AdminHeader session={session} active="home" />
      <main className="mx-auto max-w-shell px-4 py-10 sm:px-6 sm:py-14">{children}</main>
    </div>
  );
}
