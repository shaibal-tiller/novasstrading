import { leadTime } from "@/lib/content";

export function LeadTimeTable() {
  return (
    <div>
      <div className="max-w-2xl">
        <p className="eyebrow">{leadTime.eyebrow}</p>
        <h3 className="display-md mt-4 text-ink">{leadTime.title}</h3>
        <p className="mt-4 text-ink-muted">{leadTime.intro}</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-sm border border-ink/10 bg-canvas">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Sample and production lead times by product type
          </caption>
          <thead>
            <tr className="bg-ink text-ivory">
              {leadTime.columns.map((c, i) => (
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
            {leadTime.rows.map((row, r) => (
              <tr
                key={row[0]}
                className={r % 2 ? "bg-ivory/50" : "bg-canvas"}
              >
                <th
                  scope="row"
                  className="px-4 py-3 text-sm font-medium text-ink"
                >
                  {row[0]}
                </th>
                <td className="px-4 py-3 text-center font-mono text-xs text-loom">
                  {row[1]}
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs text-brass-dark">
                  {row[2]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
