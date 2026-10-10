"use client";

import { useEffect, useRef, useState } from "react";
import { BUNDLED_PHOTOS } from "@/lib/admin/bundled-photos.generated";
import { listMedia, type MediaRow } from "@/lib/admin/media-client";
import { photoUrl } from "@/lib/portfolio-photo";
import { useDialog } from "./useDialog";

const MAX_BYTES = 5 * 1024 * 1024;

/** Resolves an uploaded/local media path to a browsable URL for a plain <img>/<a>. */
export function mediaSrc(path: string): string {
  // Uploaded media -> the cPanel media host; absolute paths/URLs untouched; bundled
  // photos ("products/x.jpg", as in the portfolio) -> /assets.
  return photoUrl(path);
}

/**
 * Fixed-overlay dialog for picking media: browse the existing library or
 * upload a new file. Reuses the same visual pattern as `Portfolio.tsx`'s
 * lightbox (`role="dialog"`, `fixed inset-0 z-[...] bg-ink/95`).
 *
 * `onClose` is an intentional, disclosed addition beyond the brief's
 * `{ onSelect, accept }` interface — without it there is no way to dismiss
 * the picker without making a selection. It's optional so a caller that only
 * supplies `onSelect`/`accept` still type-checks against the brief's literal
 * shape; the backdrop/close button simply no-op when it's omitted.
 */
export function MediaPicker({
  onSelect,
  accept,
  onClose,
}: {
  onSelect: (path: string) => void;
  accept: "image" | "document";
  onClose?: () => void;
}) {
  const [tab, setTab] = useState<"existing" | "upload">("existing");
  const [media, setMedia] = useState<MediaRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [group, setGroup] = useState("All");
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(dialogRef, onClose);

  useEffect(() => {
    let cancelled = false;
    listMedia()
      .then((rows) => {
        if (!cancelled) setMedia(rows);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load the media library.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = (media ?? []).filter((m) =>
    accept === "image" ? m.mime_type.startsWith("image/") : m.mime_type === "application/pdf"
  );

  // Pictures that ship inside the website (the original portfolio, product ranges, logos).
  const groups = ["All", ...Array.from(new Set(BUNDLED_PHOTOS.map((b) => b.group)))];
  const bundled = accept === "image" ? BUNDLED_PHOTOS.filter((b) => group === "All" || b.group === group) : [];

  async function handleUpload(file: File) {
    setUploadError(null);
    if (file.size > MAX_BYTES) {
      setUploadError(
        `"${file.name}" exceeds 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB) — choose a smaller file.`
      );
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/admin/content/media/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setUploadError(body.error ?? "Upload failed.");
        return;
      }
      const body = await res.json();
      onSelect(body.path);
    } finally {
      setUploading(false);
    }
  }

  const inputLabel = accept === "image" ? "Upload new image" : "Upload new document";
  const dialogLabel = accept === "image" ? "Choose image" : "Choose document";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/95 backdrop-blur-sm p-4"
      onClick={() => onClose?.()}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-2xl bg-paper p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="field-label">{dialogLabel}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onClose?.()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl leading-none text-ink hover:bg-ink/5"
          >
            ×
          </button>
        </div>

        <div role="tablist" className="flex gap-2 border-b border-ink/10">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "existing"}
            className={`min-h-10 px-3 ${tab === "existing" ? "font-semibold" : ""}`}
            onClick={() => setTab("existing")}
          >
            Choose existing
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "upload"}
            className={`min-h-10 px-3 ${tab === "upload" ? "font-semibold" : ""}`}
            onClick={() => setTab("upload")}
          >
            Upload new
          </button>
        </div>

        {tab === "existing" ? (
          <div>
            {loadError && <p className="text-sm text-red-600">{loadError}</p>}
            {!loadError && media === null && <p className="field-label">Loading…</p>}
            {!loadError && media !== null && filtered.length === 0 && (
              <p className="field-label">{accept === "image" ? "No uploaded pictures yet." : "No media found."}</p>
            )}
            <ul className="grid grid-cols-3 gap-3">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(m.path)}
                    aria-label={`Choose ${m.original_filename}`}
                    className="flex w-full flex-col items-center gap-1 rounded-xl border border-ink/10 p-2 text-left"
                  >
                    {accept === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaSrc(m.path)}
                        alt={m.original_filename}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="truncate text-sm">{m.original_filename}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {accept === "image" && (
              <div className="mt-6 border-t border-ink/10 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="field-label">Website pictures</h3>
                  <select
                    aria-label="Show website pictures from"
                    className="field !w-auto !py-1.5 text-sm"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                  >
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <ul className="mt-3 grid grid-cols-3 gap-3">
                  {bundled.map((b) => (
                    <li key={b.path}>
                      <button
                        type="button"
                        onClick={() => onSelect(b.path)}
                        aria-label={`Choose website picture ${b.path}`}
                        className="flex w-full flex-col items-center gap-1 rounded-xl border border-ink/10 p-2 text-left"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mediaSrc(b.path)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="field-label" htmlFor="media-picker-file">
              {inputLabel}
            </label>
            <input
              id="media-picker-file"
              type="file"
              accept={accept === "image" ? "image/*" : "application/pdf"}
              className="field mt-2"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                void handleUpload(file);
              }}
            />
            {uploading && <p className="field-label mt-2">Uploading…</p>}
            {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

