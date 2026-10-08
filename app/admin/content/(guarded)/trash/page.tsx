import { listTrash } from "@/lib/cpanel-api";
import { photoUrl } from "@/lib/portfolio-photo";
import { requireContentToken } from "@/lib/admin-auth";
import { describeTrashed } from "@/lib/admin/labels";
import { plural } from "@/lib/admin/plural";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { emptyTrashAction, purgeItemAction, restoreItemAction } from "./actions";

export const metadata = { title: "Trash" };

export default async function TrashPage() {
  const token = await requireContentToken();
  const trashed = await listTrash(token);

  return (
    <main className="flex min-w-0 flex-col gap-4">
      <h1 className="display-md text-ink">Trash</h1>
      <p className="lede">
        Deleted items stay here for 30 days, then are removed automatically. Restore brings an item back; Delete
        forever removes it (and its photo, if nothing else uses it) right away and cannot be undone.
      </p>
      {trashed.length > 0 && (
        <details className="rounded-2xl border border-ink/10 p-3">
          <summary className="cursor-pointer text-sm font-medium text-ink">Empty the whole trash…</summary>
          <form action={emptyTrashAction} className="mt-3 flex flex-wrap items-center gap-3">
            <ConfirmButton
              className="btn btn-outline text-red-700"
              message={`Permanently delete all ${plural(trashed.length, "item")} in the trash? This cannot be undone.`}
            >
              Yes, permanently delete {trashed.length === 1 ? "the 1 item" : `all ${trashed.length} items`}
            </ConfirmButton>
            <span className="text-xs text-ink-muted">This cannot be undone.</span>
          </form>
        </details>
      )}
      {trashed.length === 0 && <p className="text-sm text-ink-muted">The trash is empty.</p>}
      <ul className="flex flex-col gap-2">
        {trashed.map((t) => {
          const { kind, name } = describeTrashed(t.section, t.fields);
          return (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 p-3"
            >
              <span className="flex min-w-0 items-center gap-3">
                {typeof t.fields.src === "string" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl(t.fields.src)} alt="" loading="lazy" className="h-14 w-11 shrink-0 rounded object-cover" />
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">{kind}</span>
                  <span className="break-words text-ink">{name}</span>
                </span>
              </span>
              <div className="flex gap-2">
                <form action={async () => { "use server"; await restoreItemAction(t.id); }}>
                  <button type="submit" className="btn btn-outline">Restore</button>
                </form>
                <form action={async () => { "use server"; await purgeItemAction(t.id); }}>
                  <ConfirmButton
                    className="btn btn-outline text-red-700"
                    message={`Delete “${name}” forever? This cannot be undone.`}
                  >
                    Delete forever
                  </ConfirmButton>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
