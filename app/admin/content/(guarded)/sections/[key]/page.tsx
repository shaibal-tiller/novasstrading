import { getSection } from "@/lib/cpanel-api";
import { SectionForm } from "@/components/admin/SectionForm";
import { saveSectionAction } from "./actions";

export default async function SectionEditorPage({ params }: { params: { key: string } }) {
  const fields = (await getSection(params.key)) ?? {};

  return (
    <main className="flex flex-col gap-6">
      <h1 className="display-md text-ink">{params.key}</h1>
      <SectionForm
        sectionKey={params.key}
        fields={fields}
        onSave={saveSectionAction.bind(null, params.key)}
      />
    </main>
  );
}

