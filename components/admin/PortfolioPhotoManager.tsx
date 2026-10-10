"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MAX_UPLOAD_BYTES } from "@/lib/media-limits";
import { shrinkImage } from "@/lib/admin/shrink-image";
import { weakPhotoDescription } from "@/lib/admin/tab-keys";
import { PHOTO_SIZES, isPhotoHidden, photoSize, photoUrl, type PortfolioPhoto } from "@/lib/portfolio-photo";
import { useEditMode } from "./EditModeProvider";
import type { DraftItem, Fields, SectionDraft } from "./SectionEditor";

const LIST = "portfolio.photos";
const UPLOAD_URL = "/admin/content/media/upload";
type Draftable = { setDraft: (fn: (prev: SectionDraft) => SectionDraft) => void };

function prettyName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The monthly-collection workflow for the Portfolio section: pick a category, add
 * a batch of photos, drag them into order, hide / resize / delete any photo, and
 * click one for its caption, detail lines and framing. Everything edits the same
 * draft the rest of the editor uses, so nothing is saved until "Confirm changes",
 * "Discard changes" undoes it all, and deleted photos go to Trash (restorable).
 */
export function PortfolioPhotoManager() {
  const ctx = useEditMode();
  const counter = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const draft = (ctx?.draft ?? { sections: {}, items: {} }) as SectionDraft;
  const setDraft = (ctx?.setDraft as unknown as Draftable["setDraft"]) ?? (() => {});

  const tabs = useMemo(
    () =>
      (draft.items["portfolio.tabs"] ?? []).map((t) => ({
        id: t.id,
        key: String(t.fields.key ?? ""),
        label: String(t.fields.label ?? t.fields.key ?? ""),
      })),
    [draft],
  );
  const tabKey = activeTab ?? tabs[0]?.key ?? "";
  const tabLabel = tabs.find((t) => t.key === tabKey)?.label ?? tabKey;

  const all = draft.items[LIST] ?? [];
  const mine = all.filter((i) => i.fields.tab === tabKey);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // "Manage photos" on the dashboard links here (…/edit/portfolio#photos): bring this panel into view.
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.location.hash === "#photos") panel.current?.scrollIntoView?.({ block: "start" });
  }, []);

  if (!ctx) return null;

  function patchItems(fn: (items: DraftItem[]) => DraftItem[]) {
    setDraft((prev) => ({ ...prev, items: { ...prev.items, [LIST]: fn(prev.items[LIST] ?? []) } }));
  }
  const updateFields = (id: number | string, patch: Fields) =>
    patchItems((items) => items.map((i) => (i.id === id ? { ...i, fields: { ...i.fields, ...patch } } : i)));
  const remove = (id: number | string) => patchItems((items) => items.filter((i) => i.id !== id));

  /** Puts this tab's photos into `orderedIds` order, leaving every other tab's photos where they are. */
  function applyTabOrder(orderedIds: (number | string)[]) {
    patchItems((items) => {
      const byId = new Map(items.map((i) => [i.id, i] as const));
      const slots = items.map((i, idx) => (i.fields.tab === tabKey ? idx : -1)).filter((idx) => idx >= 0);
      const next = [...items];
      slots.forEach((slot, k) => {
        const item = byId.get(orderedIds[k]);
        if (item) next[slot] = item;
      });
      return next;
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = mine.map((i) => i.id);
    const from = ids.indexOf(active.id as number | string);
    const to = ids.indexOf(over.id as number | string);
    if (from < 0 || to < 0) return;
    applyTabOrder(arrayMove(ids, from, to));
  }

  function cycleSize(item: DraftItem) {
    const sizes = [...PHOTO_SIZES];
    const next = sizes[(sizes.indexOf(photoSize(item.fields as PortfolioPhoto)) + 1) % sizes.length];
    updateFields(item.id, { size: next });
  }

  async function addPhotos(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (fileInput.current) fileInput.current.value = "";
    if (files.length === 0 || !tabKey) return;
    setErrors([]);
    setProgress({ done: 0, total: files.length });

    const created: DraftItem[] = [];
    const problems: string[] = [];
    let done = 0;
    for (const original of files) {
      try {
        if (!original.type.startsWith("image/")) throw new Error("not an image");
        if (original.size > MAX_UPLOAD_BYTES) throw new Error("larger than 25 MB");
        const file = await shrinkImage(original);
        const form = new FormData();
        form.set("file", file);
        const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
        if (!res.ok) throw new Error(res.status === 401 ? "signed out - sign in again" : `server said ${res.status}`);
        const { id, path, blur } = (await res.json()) as { id?: number; path: string; blur?: string | null };
        // So "Discard changes" can remove this file again if the photo is never confirmed.
        if (typeof id === "number") ctx?.rememberUpload?.(path, id);
        created.push({
          id: `new-p${counter.current++}`,
          fields: {
            tab: tabKey,
            src: path,
            alt: `${tabLabel} — ${prettyName(original.name)}`,
            caption: "",
            size: "normal",
            fit: "center",
            visibility: "shown",
            badge: "none",
            // Blur-up placeholder for this exact file (see PortfolioPhoto.blur).
            ...(blur ? { blur, blurSrc: path } : {}),
          },
        });
      } catch (err) {
        problems.push(`${original.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
      setProgress({ done: ++done, total: files.length });
    }

    if (created.length > 0) {
      // Newest first: the whole batch goes to the top of this category, in the order picked.
      patchItems((items) => {
        const firstOfTab = items.findIndex((i) => i.fields.tab === tabKey);
        const at = firstOfTab >= 0 ? firstOfTab : items.length;
        return [...items.slice(0, at), ...created, ...items.slice(at)];
      });
    }
    setErrors(problems);
    setProgress(null);
  }

  const hiddenCount = mine.filter((i) => isPhotoHidden(i.fields as PortfolioPhoto)).length;

  return (
    <section
      id="photos"
      ref={panel}
      aria-label="Manage portfolio photos"
      className="mt-6 scroll-mt-4 rounded-2xl border border-ink/10 bg-paper p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Manage photos</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Drag a photo by its ⠿ handle to reorder. Click or tap a photo for its caption, details, size and framing.
            Nothing goes live until you confirm.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => void addPhotos(e.target.files)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={progress !== null || !tabKey}
            onClick={() => fileInput.current?.click()}
          >
            {progress ? `Uploading ${progress.done}/${progress.total}…` : `+ Add photos to ${tabLabel}`}
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Category" className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const count = all.filter((i) => i.fields.tab === t.key).length;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === tabKey}
              onClick={() => setActiveTab(t.key)}
              className={
                "min-h-10 rounded-full border px-4 py-1.5 text-sm font-semibold " +
                (t.key === tabKey ? "border-brass bg-brass text-ivory" : "border-ink/15 text-ink hover:border-brass")
              }
            >
              {t.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => ctx?.setOpenId("portfolio.tabs.new")}
          className="min-h-10 rounded-full border border-dashed border-brass px-4 py-1.5 text-sm font-semibold text-brass-dark hover:bg-brass/10"
        >
          + New tab
        </button>
      </div>
      {tabs.find((t) => t.key === tabKey) && (
        <p className="mt-2 text-xs text-ink-muted">
          Showing the “{tabLabel}” tab.{" "}
          <button
            type="button"
            className="font-semibold text-brass-dark underline underline-offset-2"
            onClick={() => ctx?.setOpenId(`portfolio.tabs.${tabs.find((t) => t.key === tabKey)!.id}`)}
          >
            Rename or delete this tab
          </button>
        </p>
      )}

      {errors.length > 0 && (
        <ul role="alert" className="mt-3 text-sm text-red-700">
          {errors.map((m, i) => (
            <li key={i}>Could not add {m}</li>
          ))}
        </ul>
      )}

      {mine.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">No photos in {tabLabel} yet. Use “Add photos” above.</p>
      ) : (
        <>
          <p className="mt-3 text-xs text-ink-muted">
            {mine.length} photos{hiddenCount > 0 ? ` · ${hiddenCount} hidden from the public site` : ""}
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={mine.map((i) => i.id)} strategy={rectSortingStrategy}>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {mine.map((item, index) => (
                  <PhotoThumb
                    key={item.id}
                    item={item}
                    index={index}
                    onEdit={() => ctx.setOpenId(`${LIST}.${item.id}`)}
                    onToggleHidden={() =>
                      updateFields(item.id, {
                        visibility: isPhotoHidden(item.fields as PortfolioPhoto) ? "shown" : "hidden",
                      })
                    }
                    onCycleSize={() => cycleSize(item)}
                    onToTop={() => applyTabOrder([item.id, ...mine.map((i) => i.id).filter((id) => id !== item.id)])}
                    onRemove={() => remove(item.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}
    </section>
  );
}

function PhotoThumb({
  item,
  index,
  onEdit,
  onToggleHidden,
  onCycleSize,
  onToTop,
  onRemove,
}: {
  item: DraftItem;
  index: number;
  onEdit: () => void;
  onToggleHidden: () => void;
  onCycleSize: () => void;
  onToTop: () => void;
  onRemove: () => void;
}) {
  const photo = item.fields as unknown as PortfolioPhoto;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined };
  const hidden = isPhotoHidden(photo);
  const size = photoSize(photo);
  const label = (photo.caption || photo.alt || "photo").toString();

  // 28px with a mouse; 40px on phones/tablets (small screens or touch), where the controls also stay visible.
  const touch = "max-sm:h-10 max-sm:min-w-10 [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:min-w-10";
  const btn =
    "grid h-7 min-w-7 place-items-center rounded-full bg-ink/80 px-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ivory hover:bg-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass " +
    touch;
  const reveal =
    "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-100 [@media(hover:none)]:opacity-100";
  // The buttons sit on top of the clickable photo: their clicks must not also open the editor.
  const act = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <li ref={setNodeRef} style={style} className="group relative">
      <div
        onClick={onEdit}
        className={
          "relative aspect-[3/4] cursor-pointer overflow-hidden rounded-md border border-ink/10 bg-ivory " +
          (hidden ? "opacity-45" : "") +
          (isDragging ? " shadow-xl ring-2 ring-brass" : "")
        }
      >
        <Image
          src={photoUrl(photo.src)}
          alt=""
          fill
          sizes="160px"
          draggable={false}
          className={photo.fit === "whole" ? "object-contain p-1" : "object-cover"}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
          {/* The grab handle: touch-none, so a finger dragging it reorders instead of scrolling the page. */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Move ${label} by dragging`}
            title="Drag to reorder"
            className={
              "flex h-7 cursor-grab touch-none items-center gap-1 rounded-full bg-ink/80 px-2 font-mono text-[0.65rem] text-ivory hover:bg-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass active:cursor-grabbing " +
              touch
            }
          >
            <span aria-hidden>⠿</span>
            {index + 1}
          </button>
          <button
            type="button"
            className={btn + " " + reveal}
            onClick={act(onEdit)}
            aria-label={`Edit ${label}`}
            title="Edit caption, details, framing"
          >
            Edit
          </button>
        </div>
        <span className="pointer-events-none absolute left-1.5 top-12 flex flex-wrap gap-1 max-sm:top-14">
          {size !== "normal" && <Tag>{size}</Tag>}
          {photo.badge === "new" && <Tag>new</Tag>}
          {hidden && <Tag>hidden</Tag>}
          {!hidden && weakPhotoDescription(photo.alt ?? "") && <Tag>needs description</Tag>}
        </span>

        <div
          className={
            "absolute inset-x-0 bottom-0 flex flex-wrap justify-end gap-1 bg-gradient-to-t from-ink/70 to-transparent p-1.5 pt-6 " +
            reveal
          }
        >
          <button type="button" className={btn} onClick={act(onToTop)} aria-label={`Move ${label} to the top`} title="Move to the top">
            Top
          </button>
          <button
            type="button"
            className={btn}
            onClick={act(onCycleSize)}
            aria-label={`Change tile size of ${label}`}
            title="Cycle tile size: normal, wide, tall, featured"
          >
            Size
          </button>
          <button
            type="button"
            className={btn}
            onClick={act(onToggleHidden)}
            aria-label={`${hidden ? "Show" : "Hide"} ${label}`}
            title={hidden ? "Show on the site" : "Hide from the site"}
          >
            {hidden ? "Show" : "Hide"}
          </button>
          <button type="button" className={btn} onClick={act(onRemove)} aria-label={`Delete ${label}`} title="Delete (goes to Trash)">
            Del
          </button>
        </div>
      </div>
    </li>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded bg-brass px-1.5 py-0.5 font-mono text-[0.55rem] font-semibold uppercase tracking-wider text-ivory">
      {children}
    </span>
  );
}
