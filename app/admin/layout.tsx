import type { Metadata } from "next";

// Wraps every /admin/* page of this app (the sign-in door AND the website
// editor). Deliberately renders nothing of its own so the editor's layout is
// unchanged; the door's visual shell lives in app/admin/(door)/layout.tsx.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
