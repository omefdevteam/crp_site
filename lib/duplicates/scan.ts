import { eq, max, sql } from "drizzle-orm";
import {
  applicants,
  contactMessages,
  duplicateMatches,
  duplicateScans,
  partnerInquiries,
  type Db,
  type DuplicateList,
} from "@/lib/db";
import { duplicateLists } from "@/lib/db/schema";
import { isMissingTable } from "@/lib/db/missing-table";
import { findPairs, fold, type Entry } from "@/lib/duplicates/match";

// Finds repeat entries and stores them as suggestions. Safe to run any time:
// a pair that already exists, in any status, is left exactly as it is, so a
// dismissed pair stays dismissed and a decision is never undone by a rescan.

const RESCAN_AFTER_MS = 24 * 60 * 60 * 1000;

async function entriesOf(db: Db, list: DuplicateList): Promise<Entry[]> {
  if (list === "applicants") {
    const rows = await db
      .select({ id: applicants.id, createdAt: applicants.createdAt, email: applicants.email, phone: applicants.phone, name: applicants.fullName, dob: applicants.dob, track: applicants.track })
      .from(applicants);
    return rows.map(({ track, ...row }) => ({ ...row, scope: track }));
  }
  if (list === "partners") {
    const rows = await db
      .select({ id: partnerInquiries.id, createdAt: partnerInquiries.createdAt, email: partnerInquiries.email, phone: partnerInquiries.phone, name: partnerInquiries.name, organization: partnerInquiries.organization, support: partnerInquiries.support, body: partnerInquiries.message })
      .from(partnerInquiries);
    return rows.map(({ organization, support, ...row }) => ({ ...row, scope: `${fold(organization)}|${support}` }));
  }
  const rows = await db
    .select({ id: contactMessages.id, createdAt: contactMessages.createdAt, email: contactMessages.email, phone: contactMessages.phone, name: contactMessages.name, body: contactMessages.body })
    .from(contactMessages);
  return rows.map((row) => ({ ...row, scope: "message" }));
}

async function newestOf(db: Db, list: DuplicateList): Promise<Date | null> {
  const table = list === "applicants" ? applicants : list === "partners" ? partnerInquiries : contactMessages;
  const [row] = await db.select({ newest: max(table.createdAt) }).from(table);
  return row?.newest ?? null;
}

export type ScanResult = { readonly list: DuplicateList; readonly scanned: number; readonly added: number; readonly skipped: boolean };

export async function scanList(db: Db, list: DuplicateList, now = new Date()): Promise<ScanResult> {
  const [entries, newest] = await Promise.all([entriesOf(db, list), newestOf(db, list)]);
  const pairs = findPairs(list, entries);
  let added = 0;
  // Batches keep each insert well under Postgres's parameter limit.
  for (let i = 0; i < pairs.length; i += 500) {
    const batch = pairs.slice(i, i + 500);
    const inserted = await db
      .insert(duplicateMatches)
      .values(batch.map((pair) => ({
        list,
        recordId: pair.recordId,
        originalId: pair.originalId,
        reasons: [...pair.reasons],
        automatic: pair.automatic,
        status: pair.automatic ? ("confirmed" as const) : ("suggested" as const),
        decidedAt: pair.automatic ? now : null,
      })))
      .onConflictDoNothing({ target: [duplicateMatches.list, duplicateMatches.recordId, duplicateMatches.originalId] })
      .returning({ id: duplicateMatches.id });
    added += inserted.length;
  }
  await db
    .insert(duplicateScans)
    .values({ list, scannedAt: now, newestSeen: newest })
    .onConflictDoUpdate({ target: duplicateScans.list, set: { scannedAt: now, newestSeen: newest } });
  return { list, scanned: entries.length, added, skipped: false };
}

// Rescans a list only when something new has arrived since the last scan, or
// once a day. The worker calls this every minute, so the usual cost is two
// tiny reads.
export async function scanIfStale(db: Db, list: DuplicateList, now = new Date()): Promise<ScanResult> {
  const [[state], newest] = await Promise.all([
    db.select().from(duplicateScans).where(eq(duplicateScans.list, list)),
    newestOf(db, list),
  ]);
  const fresh = state
    && now.getTime() - state.scannedAt.getTime() < RESCAN_AFTER_MS
    && (newest === null || (state.newestSeen !== null && newest.getTime() <= state.newestSeen.getTime()));
  if (fresh) return { list, scanned: 0, added: 0, skipped: true };
  return scanList(db, list, now);
}

// For the worker: every list, and a missing table (migration 0022 not applied
// yet) is not an error.
export async function scanAllIfStale(db: Db): Promise<readonly ScanResult[] | "not_installed"> {
  try {
    const results: ScanResult[] = [];
    for (const list of duplicateLists) results.push(await scanIfStale(db, list));
    return results;
  } catch (err) {
    if (isMissingTable(err)) return "not_installed";
    throw err;
  }
}

// Used by tests to compare a rescan with the first scan.
export async function matchCount(db: Db): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(duplicateMatches);
  return row?.n ?? 0;
}
