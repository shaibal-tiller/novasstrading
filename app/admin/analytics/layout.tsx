import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { requireAnalyticsAccess } from "./access";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAnalyticsAccess();

  return (
    <div className="relative z-10 min-h-screen bg-canvas">
      <AdminHeader session={session} active="analytics" />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
