import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/admin-redirect";
import { getAdminSession } from "@/lib/admin-session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: { next?: string | string[] } }) {
  const raw = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  // Already signed in (e.g. a bookmarked sign-in link): go straight on instead of showing the form.
  if (await getAdminSession()) redirect(safeNextPath(raw));
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_22px_50px_-30px_rgba(22,25,31,0.35)] sm:p-8">
      <LoginForm next={safeNextPath(raw)} />
    </div>
  );
}
