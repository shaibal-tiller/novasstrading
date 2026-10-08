"use client";

import { useRef, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDialog } from "./useDialog";

export type ReorderItem = { id: number | string; label: string };

/**
 * Pure reorder step behind `handleDragEnd` — exported so the drag path can be
 * unit-tested without simulating @dnd-kit's pointer physics in jsdom (the
 * same pattern the old `ItemList.tsx` used with `computeReorderedIds`).
 */
export function applyDragEnd(order: ReorderItem[], activeId: number | string, overId: number | string): ReorderItem[] {
  const from = order.findIndex((i) => i.id === activeId);
  const to = order.findIndex((i) => i.id === overId);
  if (from === -1 || to === -1 || from === to) return order;
  return arrayMove(order, from, to);
}

function SortableRow({
  item,
  index,
  count,
  onMove,
}: {
  item: ReorderItem;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-xl border border-ink/10 bg-canvas p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${item.label}`}
        className="h-10 min-w-10 cursor-grab touch-none px-2 text-ink-muted"
      >
        ⠿
      </button>
      <span className="flex-1 truncate text-sm text-ink">{item.label}</span>
      <button
        type="button"
        aria-label={`Move ${item.label} up`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        className="h-10 min-w-10 px-2 disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        aria-label={`Move ${item.label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
        className="h-10 min-w-10 px-2 disabled:opacity-30"
      >
        ↓
      </button>
    </li>
  );
}

/**
 * A dedicated per-list reorder surface. The list items live deep inside the
 * marketing components (rendered via `SectionEditor`'s `render` prop), which
 * `SectionEditor` doesn't control the refs of — so instead of in-place drag,
 * this panel lists the items flat (by their `titleField` label) in a surface
 * `SectionEditor` fully owns, where `@dnd-kit`'s `useSortable` works cleanly.
 * Up/down buttons are an accessible (and testable) alternative to the drag.
 *
 * Reuses the fixed-overlay `role="dialog"` pattern of `EditModal`/`MediaPicker`.
 */
export function ReorderPanel({
  title,
  items,
  onApply,
  onClose,
}: {
  title: string;
  items: ReorderItem[];
  onApply: (orderedIds: (number | string)[]) => void;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<ReorderItem[]>(items);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(dialogRef, onClose);

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    setOrder((cur) => arrayMove(cur, from, to));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((cur) => applyDragEnd(cur, active.id, over.id));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl bg-paper p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="field-label">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl leading-none text-ink hover:bg-ink/5"
          >
            ×
          </button>
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {order.map((item, i) => (
                <SortableRow key={item.id} item={item} index={i} count={order.length} onMove={move} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <div className="flex gap-3">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onApply(order.map((i) => i.id))}
          >
            Apply order
          </button>
        </div>
      </div>
    </div>
  );
}

