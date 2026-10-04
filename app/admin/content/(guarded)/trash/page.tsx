import { listTrash } from "@/lib/cpanel-api";
import { photoUrl } from "@/lib/portfolio-photo";
import { requireContentToken } from "@/lib/admin-auth";
import { emptyTrashAction, purgeItemAction, restoreItemAction } from "./actions";

export default async function TrashPage() {
  const token = await requireContentToken();
  const trashed = await listTrash(token);

  return (
    <main className="flex flex-col gap-4">
      <h1 className="display-md text-ink">Trash</h1>
      <p className="lede">
        Deleted items stay here for 30 days, then are removed automatically. Restore brings an item back; Delete
        forever removes it (and its photo, if nothing else uses it) right away and cannot be undone.
      </p>
      {trashed.length > 0 && (
        <details className="rounded-2xl border border-ink/10 p-3">
          <summary className="cursor-pointer text-sm font-medium text-ink">Empty the whole trash…</summary>
          <form action={emptyTrashAction} className="mt-3 flex items-center gap-3">
            <button type="submit" className="btn btn-outline text-red-700">
              Yes, permanently delete all {trashed.length} items
            </button>
            <span className="text-xs text-ink-muted">This cannot be undone.</span>
          </form>
        </details>
      )}
      {trashed.length === 0 && <p className="text-sm text-ink-muted">The trash is empty.</p>}
      <ul className="flex flex-col gap-2">
        {trashed.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-2xl border border-ink/10 p-3">
            <span className="flex items-center gap-3">
              {typeof t.fields.src === "string" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(t.fields.src)} alt="" loading="lazy" className="h-14 w-11 rounded object-cover" />
              )}
              <span>
                {t.section} —{" "}
                {String(
                  t.fields.title ?? t.fields.name ?? t.fields.caption ?? t.fields.alt ?? t.fields.label ?? "(untitled)",
                )}
              </span>
            </span>
            <div className="flex gap-2">
              <form action={async () => { "use server"; await restoreItemAction(t.id); }}>
                <button type="submit" className="btn btn-outline">Restore</button>
              </form>
              <form action={async () => { "use server"; await purgeItemAction(t.id); }}>
                <button type="submit" className="btn btn-outline text-red-700">Delete forever</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

