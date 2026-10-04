import { redirect } from "next/navigation";

// The editor no longer has its own sign-in: everyone uses the shared door.
export default function LegacyContentLoginPage() {
  redirect("/admin/login?next=" + encodeURIComponent("/admin/content"));
}
