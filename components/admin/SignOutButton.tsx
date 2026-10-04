"use client";

import { useState } from "react";

/** Ends the shared admin session (owned by the Assets app) and returns to the sign-in door. */
export function SignOutButton({ className = "btn btn-outline" }: { className?: string }) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      await fetch("/admin/inventory/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // Ignore: the redirect below still leaves the admin area, and the
      // cookie is httpOnly so there is nothing more we can do client-side.
    }
    window.location.assign("/admin/login");
  }

  return (
    <button type="button" className={className} onClick={signOut} disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
