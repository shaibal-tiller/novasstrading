import { cookies } from "next/headers";
import { getStorageUsage, listMedia } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";
import { ContentMedia } from "@/components/ContentMedia";
import { MediaUploader } from "./MediaUploader";
import { StoragePanel } from "./StoragePanel";
import { deleteMediaAction } from "./actions";

export default async function MediaLibraryPage() {
  const media = await listMedia();
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  const usage = token ? await getStorageUsage(token).catch(() => null) : null;
  // in_use comes from the server's real check of the stored content (the old
  // used_by_count counter was never maintained, so everything read as "Unused").
  const unused = media.filter((m) => m.in_use === false);

  return (
    <main className="flex flex-col gap-8">
      <h1 className="display-md text-ink">Media library</h1>
      {usage && <StoragePanel usage={usage} />}
      <MediaUploader />

      <section>
        <h2 className="field-label mb-3">All media ({media.length})</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {media.map((m) => (
            <li key={m.id} className="rounded-2xl border border-ink/10 p-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-canvas">
                <ContentMedia src={m.path} alt={m.original_filename} kind="image" aspect="aspect-square" fit="cover" />
              </div>
              <p className="mt-2 truncate text-xs text-ink-muted">{m.original_filename}</p>
              <p className="text-xs text-ink-muted">{(m.bytes / 1024).toFixed(0)} KB · {m.width}×{m.height}</p>
              <p className="text-xs font-medium text-brass-dark">
                {m.in_use === false ? "Unused - safe to delete" : "In use"}
              </p>
              {m.in_use === false && (
                <form action={deleteMediaAction.bind(null, m.id)}>
                  <button type="submit" className="btn btn-outline mt-2 w-full text-xs">
                    Delete
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      {unused.length > 0 && (
        <section>
          <h2 className="field-label mb-3">Cleanup — unused files ({unused.length})</h2>
          <p className="lede">
            These aren&apos;t used by any content (including the trash). Delete them here, or let the automatic cleanup
            remove them after 3 days.
          </p>
        </section>
      )}
    </main>
  );
}

