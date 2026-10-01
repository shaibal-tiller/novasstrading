import Link from "next/link";
import { listItems } from "@/lib/cpanel-api";
import { ItemList } from "./ItemList";
import { deleteItemAction, reorderItemsAction } from "./actions";

export default async function ItemsPage({ params }: { params: { section: string } }) {
  const items = await listItems(params.section);

  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="display-md text-ink">{params.section}</h1>
        <Link href={`/admin/content/items/${params.section}/new`} className="btn btn-primary">
          Add item
        </Link>
      </div>
      <ItemList
        section={params.section}
        items={items}
        onDelete={deleteItemAction}
        onReorder={reorderItemsAction.bind(null, params.section)}
      />
    </main>
  );
}

