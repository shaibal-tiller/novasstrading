import Link from "next/link";
import { SECTION_REGISTRY } from "@/lib/admin/section-registry";

export default function ContentPickerPage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-md text-ink">Content sections</h1>
        <nav className="flex gap-4">
          <Link href="/admin/content/media" className="field-label hover:text-brass-dark">
            Media library
          </Link>
          <Link href="/admin/content/trash" className="field-label hover:text-brass-dark">
            Trash
          </Link>
        </nav>
      </div>

      <p className="lede max-w-2xl">
        Pick a section to edit it visually — click any text or image in the live
        preview to change it, then confirm all your changes at once.
      </p>

      <ul className="flex flex-col divide-y divide-ink/10">
        {SECTION_REGISTRY.map((entry) => (
          <li key={entry.key} className="py-3">
            <Link
              href={`/admin/content/edit/${entry.key}`}
              className="font-medium text-ink hover:text-brass-dark"
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
