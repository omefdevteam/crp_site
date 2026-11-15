import type { ReactNode } from "react";
import { RecordCell } from "@/components/admin/RecordCell";
import { RowLink, linkedRowClass } from "@/components/admin/RowLink";

export type RecordTableRow = {
  readonly id: string;
  readonly href: string | null;
  readonly cells: readonly string[];
  /** Repeats an earlier entry: confirmed, or waiting for a decision. */
  readonly repeat?: "suggested" | "confirmed";
};

function RepeatTag({ repeat }: { repeat: "suggested" | "confirmed" }) {
  return (
    <span className={`relative z-0 ml-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${repeat === "confirmed" ? "bg-black/10 text-black" : "bg-[#fff1e2] text-[#8a4a00]"}`}>
      {repeat === "confirmed" ? "Repeat" : "Possible repeat"}
    </span>
  );
}

export function RecordTable({
  list,
  headers,
  rows,
  leading,
}: {
  list: string;
  headers: readonly string[];
  rows: readonly RecordTableRow[];
  leading?: (row: RecordTableRow) => ReactNode;
}) {
  return (
    <div className="mt-4 min-w-0 max-w-full overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr>
            {leading ? <th scope="col" className="pb-2 font-semibold"><span className="sr-only">Select</span></th> : null}
            {headers.map((header) => <th key={header} scope="col" className="pb-2 font-semibold">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const name = row.cells[0] ?? "record";
            return (
              <tr key={row.id} className={row.href ? linkedRowClass : undefined}>
                {leading ? <td className="relative z-20 border-t border-black/10 py-3 pr-4">{leading(row)}</td> : null}
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${index}`} className="border-t border-black/10 py-3 pr-4">
                    {index === 0 && row.href ? <RowLink href={row.href} name={name} /> : null}
                    <span className="relative z-0"><RecordCell list={list} header={headers[index] ?? ""} value={cell} /></span>
                    {index === 0 && row.repeat ? <RepeatTag repeat={row.repeat} /> : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
