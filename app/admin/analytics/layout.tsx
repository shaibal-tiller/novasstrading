import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { requireAnalyticsAccess } from "./access";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAnalyticsAccess();

  return (
    <div className="relative z-10 min-h-screen bg-canvas">
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-ink/10 px-4 py-4 sm:px-6">
        <span className="field-label">Nova SS Trading — Analytics</span>
        <Link href="/admin" className="field-label hover:text-brass-dark">
          Admin home
        </Link>
        <span className="ml-auto flex items-center gap-4">
          <span className="hidden text-xs text-ink-muted sm:inline">{session.email}</span>
          <SignOutButton className="btn btn-outline text-xs" />
        </span>
      </nav>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
