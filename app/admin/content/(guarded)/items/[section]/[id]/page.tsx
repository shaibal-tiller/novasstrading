import { notFound } from "next/navigation";
import { listItems } from "@/lib/cpanel-api";
import { SectionForm } from "@/components/admin/SectionForm";
import { saveItemAction } from "./actions";

export default async function ItemEditorPage({ params }: { params: { section: string; id: string } }) {
  const id = Number(params.id);
  const items = await listItems(params.section);
  const item = items.find((i) => i.id === id);
  if (!item) notFound();

  return (
    <main className="flex flex-col gap-6">
      <h1 className="display-md text-ink">Edit item — {params.section}</h1>
      <SectionForm
        sectionKey={`${params.section}#${id}`}
        fields={item.fields}
        onSave={saveItemAction.bind(null, params.section, id)}
      />
    </main>
  );
}

