"use client";

import type { ReactNode } from "react";
import { useEditMode } from "./EditModeProvider";

export function Editable({
  id,
  kind,
  as: Tag = "span",
  className,
  children,
}: {
  id: string;
  kind: "text" | "media" | "document" | "item";
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: ReactNode;
}) {
  const ctx = useEditMode();

  // Outside any EditModeProvider (i.e. on the public marketing site) this
  // is a complete no-op: render children with zero extra DOM.
  if (!ctx) return <>{children}</>;

  const hovered = ctx.hoveredId === id;

  return (
    <Tag
      data-editable-id={id}
      data-editable-kind={kind}
      className={[
        className,
        hovered ? "outline outline-2 outline-brass outline-offset-2 cursor-pointer" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={(e) => {
        e.stopPropagation();
        ctx.setOpenId(id);
      }}
    >
      {children}
    </Tag>
  );
}

