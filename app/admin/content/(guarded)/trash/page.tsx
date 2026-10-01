import { listTrash } from "@/lib/cpanel-api";
import { restoreItemAction } from "./actions";

export default async function TrashPage() {
  const trashed = await listTrash();

  return (
    <main className="flex flex-col gap-4">
      <h1 className="display-md text-ink">Trash</h1>
      <p className="lede">Deleted items stay here for 30 days before permanent removal.</p>
      <ul className="flex flex-col gap-2">
        {trashed.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-2xl border border-ink/10 p-3">
            <span>{t.section} — {String(t.fields.title ?? t.fields.name ?? "(untitled)")}</span>
            <form action={async () => { "use server"; await restoreItemAction(t.id); }}>
              <button type="submit" className="btn btn-outline">Restore</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

