"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { confirmLeave } from "@/lib/admin/unsaved";

function shouldAsk(e: MouseEvent<HTMLAnchorElement>): boolean {
  // Ctrl/Cmd/middle-click opens a new tab and leaves this page where it is.
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);
}

/** A link that first asks "You have unsaved changes. Leave anyway?" while the editor has unconfirmed edits. */
export function GuardedLink(props: ComponentProps<typeof Link>) {
  const { onClick, ...rest } = props;
  return (
    <Link
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && shouldAsk(e) && !confirmLeave()) e.preventDefault();
      }}
    />
  );
}

/** Same guard for a plain `<a>` (full page loads, such as the Assets app). */
export function GuardedAnchor(props: ComponentProps<"a">) {
  const { onClick, ...rest } = props;
  return (
    <a
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && shouldAsk(e) && !confirmLeave()) e.preventDefault();
      }}
    />
  );
}
