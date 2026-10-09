"use client";

import Link from "next/link";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Item = { id: number; fields: Record<string, unknown> };

function titleOf(fields: Record<string, unknown>): string {
  return String(fields.title ?? fields.name ?? fields.label ?? "(untitled)");
}

function Row({ section, item, onDelete }: { section: string; item: Item; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center justify-between rounded-2xl border border-ink/10 p-3">
      <button type="button" {...attributes} {...listeners} aria-label="Drag to reorder" className="cursor-grab px-2 text-ink-muted">
        ⠿
      </button>
      <Link href={`/admin/content/items/${section}/${item.id}`} className="flex-1 font-medium text-ink hover:text-brass-dark">
        {titleOf(item.fields)}
      </Link>
      <button type="button" onClick={() => onDelete(item.id)} className="btn btn-outline" aria-label={`Delete ${titleOf(item.fields)}`}>
        Delete
      </button>
    </li>
  );
}

export function computeReorderedIds(items: Item[], activeId: number, overId: number): number[] {
  const oldIndex = items.findIndex((i) => i.id === activeId);
  const newIndex = items.findIndex((i) => i.id === overId);
  return arrayMove(items, oldIndex, newIndex).map((i) => i.id);
}

export function ItemList({
  section,
  items,
  onDelete,
  onReorder,
}: {
  section: string;
  items: Item[];
  onDelete: (id: number) => void;
  onReorder: (orderedIds: number[]) => void;
}) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(computeReorderedIds(items, active.id as number, over.id as number));
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <Row key={item.id} section={section} item={item} onDelete={onDelete} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

