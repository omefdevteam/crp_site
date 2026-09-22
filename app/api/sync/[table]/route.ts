import { NextResponse, type NextRequest } from "next/server";
import { asc, gt, sql } from "drizzle-orm";
import { getDb, applicants, waitlist, interest, nominations } from "@/lib/db";
import { secretOk } from "@/lib/api-auth";
import { applicantSyncRow } from "@/lib/sync";
import { pageChanges } from "@/lib/sync-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_MAX = 500;

// Two ways to page. The durable one is `after=<revision>`: every committed
// change has a strictly increasing revision, so a client that stores the last
// `cursor` it saw can never skip a change or read the same one twice, however
// long it was away. `changedSince=<timestamp>` is kept for the existing Power
// Automate flow; it now pages by (updatedAt, id) and returns a `next` cursor.
type Table = "applicants" | "waitlist" | "interest" | "nominations";
const TABLES = new Set<Table>(["applicants", "waitlist", "interest", "nominations"]);

async function byRevision(table: Table, after: bigint, limit: number) {
  const page = await pageChanges(getDb(), table, after, limit);
  return {
    rows: page.rows.map((r) => ({ revision: r.revision.toString(), operation: r.operation, ...(r.payload as object) })),
    cursor: page.cursor.toString(),
    hasMore: page.hasMore,
  };
}

async function byTimestamp(table: Table, since: Date, afterId: string | null, limit: number) {
  const source = { applicants, waitlist, interest, nominations }[table];
  // Keyset on (updatedAt, id). JS Date only has millisecond precision, so the
  // cursor compares epoch milliseconds rather than the raw timestamptz; otherwise
  // a row whose microseconds were truncated would be returned again on the next page.
  const where = afterId
    ? sql`(floor(extract(epoch from ${source.updatedAt}) * 1000), ${source.id}) > (${since.getTime()}, ${afterId}::uuid)`
    : gt(source.updatedAt, since);
  const rows = await getDb()
    .select()
    .from(source)
    .where(where)
    .orderBy(asc(source.updatedAt), asc(source.id))
    .limit(limit + 1);
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    rows: table === "applicants" ? (page as (typeof applicants.$inferSelect)[]).map(applicantSyncRow) : page,
    next: last ? { changedSince: last.updatedAt.toISOString(), afterId: last.id } : null,
    hasMore: rows.length > limit,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> },
) {
  if (!secretOk(req.headers.get("x-sync-secret"), process.env.SYNC_API_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { table } = await params;
  if (!TABLES.has(table as Table)) return NextResponse.json({ error: "unknown table" }, { status: 404 });

  const q = req.nextUrl.searchParams;
  const limit = Math.min(PAGE_MAX, Math.max(1, Number(q.get("limit")) || 200));

  const after = q.get("after");
  if (after !== null) {
    if (!/^\d+$/.test(after)) return NextResponse.json({ error: "after is not a revision" }, { status: 400 });
    return NextResponse.json(await byRevision(table as Table, BigInt(after), limit));
  }

  const sinceParam = q.get("changedSince");
  const since = sinceParam ? new Date(sinceParam) : new Date(0);
  if (Number.isNaN(since.getTime())) {
    return NextResponse.json({ error: "changedSince is not a date" }, { status: 400 });
  }
  const afterId = q.get("afterId");
  return NextResponse.json(await byTimestamp(table as Table, since, afterId, limit));
}
