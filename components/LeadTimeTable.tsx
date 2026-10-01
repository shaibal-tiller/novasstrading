import { Editable } from "./admin/Editable";

const COLUMNS = ["Products / Accessories", "Sample Lead-Time", "Production Lead-Time"];

type LeadTime = {
  eyebrow: string;
  title: string;
  intro: string;
  rows: string[][];
};

export function LeadTimeTable({ leadTime }: { leadTime: LeadTime }) {
  // Local item-id widening: DB rows carry a numeric `id`; the static content
  // type doesn't. See Task 8 brief — `id` is `undefined` at runtime here,
  // which is safe since Editable never reads it outside edit mode.
  type RowWithId = (typeof leadTime.rows)[number] & { id: number };
  const rows = leadTime.rows as unknown as RowWithId[];

  return (
    <div>
      <div className="max-w-2xl">
        <p className="eyebrow">
          <Editable id="leadTime.eyebrow" kind="text">{leadTime.eyebrow}</Editable>
        </p>
        <h3 className="display-md mt-4 text-ink">
          <Editable id="leadTime.title" kind="text">{leadTime.title}</Editable>
        </h3>
        <p className="mt-4 text-ink-muted">
          <Editable id="leadTime.intro" kind="text">{leadTime.intro}</Editable>
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-sm border border-ink/10 bg-canvas">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Sample and production lead times by product type
          </caption>
          <thead>
            <tr className="bg-ink text-ivory">
              {COLUMNS.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-4 py-3.5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.12em] ${
                    i === 0 ? "" : "text-center"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr
                key={row[0]}
                className={r % 2 ? "bg-ivory/50" : "bg-canvas"}
              >
                <th
                  scope="row"
                  className="px-4 py-3 text-sm font-medium text-ink"
                >
                  <Editable id={`leadTime.rows.${row.id}`} kind="item" className="block h-full w-full">{row[0]}</Editable>
                </th>
                <td className="px-4 py-3 text-center font-mono text-xs text-loom">
                  <Editable id={`leadTime.rows.${row.id}`} kind="item" className="block h-full w-full">{row[1]}</Editable>
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs text-brass-dark">
                  <Editable id={`leadTime.rows.${row.id}`} kind="item" className="block h-full w-full">{row[2]}</Editable>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

