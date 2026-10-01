import { SectionForm } from "@/components/admin/SectionForm";
import { createItemAction } from "./actions";

export default function NewItemPage({ params }: { params: { section: string } }) {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="display-md text-ink">Add item — {params.section}</h1>
      <SectionForm
        sectionKey={`${params.section}#new`}
        fields={{ title: "", body: "" }}
        onSave={createItemAction.bind(null, params.section)}
      />
    </main>
  );
}

