"use client";

import { useEffect, useRef, useState } from "react";
import { AdminIcon } from "./AdminIcon";
import { SignOutButton } from "./SignOutButton";

/**
 * The profile button in the admin header: an avatar with the person's name that opens a small
 * card (who they are, what they can open) with Sign out inside. A separate Sign out button
 * sits next to it in the header, so signing out is always one click.
 */
export function ProfileMenu({
  name,
  initials,
  email,
  roleLabel,
  access,
}: {
  name: string;
  initials: string;
  email: string;
  roleLabel: string;
  access: string[];
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Profile: ${name}`}
        className="flex items-center gap-2.5 rounded-full border border-ink/10 bg-white py-1 pl-1 pr-3 transition-colors hover:border-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/40"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-mono text-[0.7rem] font-semibold tracking-wider text-ivory">
          {initials}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink md:block">{name}</span>
        <AdminIcon name="chevron" className={`h-4 w-4 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_18px_50px_-20px_rgba(22,25,31,0.35)]"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink font-mono text-sm font-semibold tracking-wider text-ivory">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{name}</p>
              <p className="truncate text-xs text-ink-muted">{email}</p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-ink/10 pt-4 text-sm">
            <dt className="field-label self-center">Role</dt>
            <dd className="text-ink">{roleLabel}</dd>
            <dt className="field-label self-center">Access</dt>
            <dd className="text-ink">{access.length > 0 ? access.join(", ") : "None yet"}</dd>
          </dl>

          <div className="mt-4 border-t border-ink/10 pt-4">
            <SignOutButton className="btn btn-outline w-full !py-2.5 text-xs" />
          </div>
        </div>
      )}
    </div>
  );
}
