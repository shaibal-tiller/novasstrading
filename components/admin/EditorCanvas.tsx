"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { useEditMode } from "./EditModeProvider";

export function EditorCanvas({
  children,
  labelLookup,
}: {
  children: ReactNode;
  labelLookup: (id: string) => string | undefined;
}) {
  const ctx = useEditMode();
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ctx) return;
    const target = e.target as HTMLElement;
    const editableEl = target.closest("[data-editable-id]");
    const id = editableEl?.getAttribute("data-editable-id") ?? null;
    ctx.setHoveredId(id);
    setCursor({ x: e.clientX, y: e.clientY });
  }

  const hoveredLabel = ctx?.hoveredId ? labelLookup(ctx.hoveredId) : undefined;

  return (
    <div onMouseMove={handleMouseMove} className="relative">
      {children}
      {hoveredLabel ? (
        <div
          className="pointer-events-none fixed z-50 rounded bg-ink px-2 py-1 text-xs font-medium text-paper shadow-lg"
          style={{ left: cursor.x + 12, top: cursor.y + 12 }}
        >
          {hoveredLabel}
        </div>
      ) : null}
    </div>
  );
}

