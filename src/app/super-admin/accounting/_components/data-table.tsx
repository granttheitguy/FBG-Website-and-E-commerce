import React from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataTableColumn {
  /** Key used to look up the value in each row record */
  key: string
  /** Column header label */
  label: string
  /** Text alignment for both header and cells (default: "left") */
  align?: "left" | "right" | "center"
}

export interface DataTableProps {
  /** Column definitions */
  columns: DataTableColumn[]
  /** Row data — each record maps column keys to renderable content */
  rows: Array<Record<string, React.ReactNode>>
  /** Message shown when the table has no rows */
  emptyMessage?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const alignClass: Record<NonNullable<DataTableColumn["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found",
}: DataTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-sm border border-obsidian-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-obsidian-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-obsidian-500 ${alignClass[col.align ?? "left"]}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-obsidian-100">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-obsidian-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="transition-colors hover:bg-obsidian-50/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm text-obsidian-700 ${alignClass[col.align ?? "left"]}`}
                  >
                    {row[col.key] ?? "\u2014"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
