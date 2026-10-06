import { safeNextPath } from "@/lib/admin-redirect";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default function AdminLoginPage({ searchParams }: { searchParams: { next?: string | string[] } }) {
  const raw = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_22px_50px_-30px_rgba(22,25,31,0.35)] sm:p-8">
      <LoginForm next={safeNextPath(raw)} />
    </div>
  );
}
