import { safeNextPath } from "@/lib/admin-redirect";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default function AdminLoginPage({ searchParams }: { searchParams: { next?: string | string[] } }) {
  const raw = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  return <LoginForm next={safeNextPath(raw)} />;
}
