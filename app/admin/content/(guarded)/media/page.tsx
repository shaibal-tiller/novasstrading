import { listMedia } from "@/lib/cpanel-api";
import { ContentMedia } from "@/components/ContentMedia";
import { MediaUploader } from "./MediaUploader";
import { deleteMediaAction } from "./actions";

export default async function MediaLibraryPage() {
  const media = await listMedia();
  const unused = media.filter((m) => m.used_by_count === 0);

  return (
    <main className="flex flex-col gap-8">
      <h1 className="display-md text-ink">Media library</h1>
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
                {m.used_by_count > 0 ? `Used ${m.used_by_count}×` : "Unused"}
              </p>
              <form action={deleteMediaAction.bind(null, m.id)}>
                <button type="submit" className="btn btn-outline mt-2 w-full text-xs">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {unused.length > 0 && (
        <section>
          <h2 className="field-label mb-3">Cleanup — unused files ({unused.length})</h2>
          <p className="lede">These aren&apos;t referenced by any content. Review and delete what you don&apos;t need.</p>
        </section>
      )}
    </main>
  );
}

