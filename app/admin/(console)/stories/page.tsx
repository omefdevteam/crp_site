import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/admin/Button";
import { When } from "@/components/admin/When";
import { card } from "@/components/admin/marks";
import { countryLabel, findCountry } from "@/lib/countries";
import { getDb } from "@/lib/db";
import { languageLabel } from "@/lib/admin/labels";
import { listForReview, parseQueueFilter, type QueueFilter, type QueueRow } from "@/lib/ambassador/review";
import { requireStaff } from "@/lib/staff/gate";

export const metadata: Metadata = { title: "Stories" };

const TABS: readonly { readonly filter: QueueFilter; readonly label: string }[] = [
  { filter: "submitted", label: "Waiting for review" },
  { filter: "approved", label: "On the globe" },
  { filter: "rejected", label: "Sent back" },
  { filter: "all", label: "All" },
];

const STATUS: Record<QueueRow["status"], string> = {
  draft: "Draft",
  submitted: "Waiting",
  approved: "On the globe",
  rejected: "Sent back",
  withdrawn: "Withdrawn",
};

function stamp(value: Date | null): string {
  return value ? value.toISOString().slice(0, 16).replace("T", " ") : "";
}

function place(row: QueueRow): string {
  if (!row.city) return "No place";
  const country = row.country ? findCountry(row.country) : undefined;
  return `${row.city}, ${country ? countryLabel(country, "en") : row.country}`;
}

async function load(filter: QueueFilter): Promise<QueueRow[] | null> {
  try {
    return await listForReview(getDb(), filter);
  } catch {
    // The stories table arrives with migration 0021.
    return null;
  }
}

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff("stories.review");
  const filter = parseQueueFilter((await searchParams).status);
  const rows = await load(filter);
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Stories</h1>
        <p className="mt-2 max-w-2xl text-sm text-black/60">
          Stories Ambassadors send for the home page globe. Nothing appears on the globe until it is approved here.
          Drafts stay private to the Ambassador.
        </p>
      </div>
      <nav aria-label="Story lists" className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.filter}
            href={tab.filter === "submitted" ? "/admin/stories" : `/admin/stories?status=${tab.filter}`}
            variant={tab.filter === filter ? "solid" : "outline"}
            size="sm"
            aria-current={tab.filter === filter ? "page" : undefined}
          >
            {tab.label}
          </Button>
        ))}
      </nav>
      <section className={card}>
        {rows === null ? (
          <p className="text-sm text-black/60">Stories aren&rsquo;t switched on yet.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-black/60">{filter === "submitted" ? "Nothing waiting. New stories show up here." : "No stories in this list."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr>
                  {["Story", "Type", "Place", "By", "Language", filter === "submitted" ? "Sent" : "Updated", "Status"].map((header) => (
                    <th key={header} scope="col" className="pb-2 pr-4 font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="border-t border-black/10 py-3 pr-4">
                      <Link href={`/admin/stories/${row.id}`} className="font-semibold underline-offset-4 hover:underline">
                        {row.title ?? "Untitled"}
                      </Link>
                      {row.hasPhoto ? <span className="ml-2 text-xs text-black/50">Photo</span> : null}
                    </td>
                    <td className="border-t border-black/10 py-3 pr-4">{row.kind === "beacon" ? "Beacon" : "Mission"}</td>
                    <td className="border-t border-black/10 py-3 pr-4">{place(row)}</td>
                    <td className="border-t border-black/10 py-3 pr-4">{row.author}</td>
                    <td className="border-t border-black/10 py-3 pr-4">{languageLabel(row.language)}</td>
                    <td className="border-t border-black/10 py-3 pr-4">
                      <When stamp={stamp(filter === "submitted" ? row.submittedAt : row.updatedAt)} />
                    </td>
                    <td className="border-t border-black/10 py-3">{STATUS[row.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
