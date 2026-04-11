"use client";

interface Props {
  columns: string[];
  rows: Record<string, unknown>[];
}

export default function ResultsTable({ columns, rows }: Props) {
  if (!rows.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin max-h-72">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-xs font-semibold text-sky-400 uppercase tracking-wider border-b border-gray-700 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-gray-900/60" : "bg-gray-900/30"}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 text-gray-300 border-b border-gray-800/50 whitespace-nowrap max-w-xs truncate"
                    title={String(row[col] ?? "")}
                  >
                    {String(row[col] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-800/50 text-xs text-gray-500 border-t border-gray-700">
        {rows.length} row{rows.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
