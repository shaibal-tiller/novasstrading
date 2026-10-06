import { SECTION_REGISTRY } from "@/lib/admin/section-registry";
import { FALLBACK_SECTION_INFO, SECTION_INFO, SITE_WIDE_KEYS } from "@/lib/admin/section-info";
import { AdminCard } from "@/components/admin/AdminCard";

function Group({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
        <p className="text-sm text-ink-muted">{hint}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
    </section>
  );
}

export default function ContentPickerPage() {
  const pageSections = SECTION_REGISTRY.filter((e) => !SITE_WIDE_KEYS.includes(e.key));
  const siteWide = SECTION_REGISTRY.filter((e) => SITE_WIDE_KEYS.includes(e.key));

  return (
    <main className="mx-auto flex max-w-shell flex-col gap-10">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Website</span>
        <h1 className="display-lg text-ink">Website content</h1>
        <p className="lede max-w-2xl">
          Pick a part of the website to edit it visually: click any text or image in the live preview to change it,
          then confirm all your changes at once.
        </p>
      </div>

      <Group title="Your tools" hint="The things you reach for most.">
        <li>
          <AdminCard
            dark
            href="/admin/content/edit/portfolio"
            icon="image"
            title="Portfolio photos"
            description="Add this month's collection, reorder, resize, frame, hide, caption or remove photos."
            cta="Manage photos"
          />
        </li>
        <li>
          <AdminCard
            href="/admin/content/media"
            icon="image"
            title="Media library"
            description="Every uploaded photo and document, plus how much storage is used."
            cta="Open library"
          />
        </li>
        <li>
          <AdminCard
            href="/admin/content/trash"
            icon="trash"
            title="Trash"
            description="Deleted items wait here for 30 days. Restore them, or delete them for good."
            cta="Open trash"
          />
        </li>
      </Group>

      <Group title="Page sections" hint="In the order visitors see them, from the top of the page down.">
        {pageSections.map((entry, i) => {
          const info = SECTION_INFO[entry.key] ?? FALLBACK_SECTION_INFO;
          return (
            <li key={entry.key}>
              <AdminCard
                href={`/admin/content/edit/${entry.key}`}
                icon={info.icon}
                title={entry.label}
                description={info.description}
                number={i + 1}
              />
            </li>
          );
        })}
      </Group>

      <Group title="Whole-site settings" hint="These appear on every page.">
        {siteWide.map((entry) => {
          const info = SECTION_INFO[entry.key] ?? FALLBACK_SECTION_INFO;
          return (
            <li key={entry.key}>
              <AdminCard
                href={`/admin/content/edit/${entry.key}`}
                icon={info.icon}
                title={entry.label}
                description={info.description}
              />
            </li>
          );
        })}
      </Group>
    </main>
  );
}
