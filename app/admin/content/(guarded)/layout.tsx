import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/session";

export default function AdminContentLayout({ children }: { children: React.ReactNode }) {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;

  if (!token) {
    redirect("/admin/content/login");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <nav className="flex items-center gap-6 border-b border-ink/10 px-6 py-4">
        <span className="field-label">Nova SS Trading — Content</span>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}

