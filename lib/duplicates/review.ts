import { and, count, countDistinct, eq, inArray, or, sql } from "drizzle-orm";
import { recordEvent } from "@/lib/admin/events";
import {
  applicants,
  contactMessages,
  duplicateMatches,
  partnerInquiries,
  type Db,
  type DuplicateList,
  type DuplicateStatus,
  type Store,
} from "@/lib/db";
import { isMissingTable } from "@/lib/db/missing-table";
import { REASON_LABEL, type Reason } from "@/lib/duplicates/match";
import type { Staff } from "@/lib/staff/auth";
import { can, type Capability } from "@/lib/staff/roles";

// Reading and deciding repeat entries. Whoever can act on a record decides
// about its repeats; whoever can read the list sees the labels.

export const DECIDE_CAPABILITY: Record<DuplicateList, Capability> = {
  applicants: "reviews.write",
  partners: "partners.manage",
  messages: "messages.manage",
};

export function canDecide(role: string, list: DuplicateList): boolean {
  return can(role, DECIDE_CAPABILITY[list]);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let installedSeen = false;

// True once migration 0022 has been applied. to_regclass never raises, so this
// is safe inside a caller's transaction, where a failed query would abort
// everything after it. Once the table exists it stays, so a yes is remembered.
export async function repeatsInstalled(db: Store): Promise<boolean> {
  if (installedSeen) return true;
  const result = await db.execute(sql`select to_regclass('public.duplicate_matches') is not null as present`);
  const rows = (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? []) as { present?: boolean }[];
  installedSeen = rows[0]?.present === true;
  return installedSeen;
}

/** What repeatsInstalled last found, for code that builds SQL synchronously. */
export function repeatsSeen(): boolean {
  return installedSeen;
}

// Before migration 0022 every read below answers "nothing to show".
async function orEmpty<T>(db: Store, work: () => Promise<T>, empty: T): Promise<T> {
  if (!(await repeatsInstalled(db))) return empty;
  return work();
}

export type RepeatFlag = "suggested" | "confirmed";

/** For list rows: which of these records are a repeat of an earlier entry. */
export async function flagsFor(db: Store, list: DuplicateList, ids: readonly string[]): Promise<ReadonlyMap<string, RepeatFlag>> {
  const valid = ids.filter((id) => UUID.test(id));
  if (valid.length === 0) return new Map();
  return orEmpty(db, async () => {
    const rows = await db
      .select({ recordId: duplicateMatches.recordId, status: duplicateMatches.status })
      .from(duplicateMatches)
      .where(and(eq(duplicateMatches.list, list), inArray(duplicateMatches.recordId, valid), inArray(duplicateMatches.status, ["suggested", "confirmed"])));
    const flags = new Map<string, RepeatFlag>();
    for (const row of rows) {
      // Confirmed wins over a still-open suggestion for the same entry.
      if (row.status === "confirmed" || !flags.has(row.recordId)) flags.set(row.recordId, row.status as RepeatFlag);
    }
    return flags;
  }, new Map());
}

export type RepeatCounts = {
  /** Entries confirmed as a repeat of an earlier one. */
  readonly repeats: number;
  /** Entries with a suggestion still waiting for a decision. */
  readonly suggested: number;
};

export async function repeatCounts(db: Store, list: DuplicateList): Promise<RepeatCounts> {
  return orEmpty(db, async () => {
    const rows = await db
      .select({ status: duplicateMatches.status, n: countDistinct(duplicateMatches.recordId) })
      .from(duplicateMatches)
      .where(and(eq(duplicateMatches.list, list), inArray(duplicateMatches.status, ["suggested", "confirmed"])))
      .groupBy(duplicateMatches.status);
    const of = (status: DuplicateStatus) => Number(rows.find((row) => row.status === status)?.n ?? 0);
    return { repeats: of("confirmed"), suggested: of("suggested") };
  }, { repeats: 0, suggested: 0 });
}

export type OtherEntry = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly href: string;
};

export type MatchView = {
  readonly id: string;
  readonly status: DuplicateStatus;
  readonly automatic: boolean;
  readonly reasons: readonly string[];
  /** "earlier": the other entry came first, so this one is the repeat. */
  readonly side: "earlier" | "later";
  readonly other: OtherEntry | null;
  readonly decidedAt: Date | null;
};

const HREF: Record<DuplicateList, (id: string) => string> = {
  applicants: (id) => `/admin/records/applicants/${id}`,
  partners: (id) => `/admin/records/partners/${id}`,
  messages: (id) => `/admin/records/messages/${id}`,
};

async function others(db: Store, list: DuplicateList, ids: readonly string[]): Promise<Map<string, OtherEntry>> {
  if (ids.length === 0) return new Map();
  const rows = list === "applicants"
    ? await db.select({ id: applicants.id, name: applicants.fullName, email: applicants.email, createdAt: applicants.createdAt }).from(applicants).where(inArray(applicants.id, [...ids]))
    : list === "partners"
      ? await db.select({ id: partnerInquiries.id, name: partnerInquiries.name, email: partnerInquiries.email, createdAt: partnerInquiries.createdAt }).from(partnerInquiries).where(inArray(partnerInquiries.id, [...ids]))
      : await db.select({ id: contactMessages.id, name: contactMessages.name, email: contactMessages.email, createdAt: contactMessages.createdAt }).from(contactMessages).where(inArray(contactMessages.id, [...ids]));
  return new Map(rows.map((row) => [row.id, { ...row, href: HREF[list](row.id) }]));
}

/** For a record's page: every match it is part of, either side. */
export async function matchesFor(db: Store, list: DuplicateList, recordId: string): Promise<readonly MatchView[]> {
  if (!UUID.test(recordId)) return [];
  return orEmpty(db, async () => {
    const rows = await db
      .select()
      .from(duplicateMatches)
      .where(and(eq(duplicateMatches.list, list), or(eq(duplicateMatches.recordId, recordId), eq(duplicateMatches.originalId, recordId))));
    const otherIds = rows.map((row) => (row.recordId === recordId ? row.originalId : row.recordId));
    const found = await others(db, list, otherIds);
    return rows
      .map((row): MatchView => {
        const side = row.recordId === recordId ? "earlier" : "later";
        const otherId = side === "earlier" ? row.originalId : row.recordId;
        return {
          id: row.id,
          status: row.status,
          automatic: row.automatic,
          reasons: row.reasons.map((reason) => REASON_LABEL[reason as Reason] ?? reason),
          side,
          other: found.get(otherId) ?? null,
          decidedAt: row.decidedAt,
        };
      })
      // Open suggestions first, then the newest other entry.
      .sort((a, b) => Number(a.status !== "suggested") - Number(b.status !== "suggested") || (b.other?.createdAt.getTime() ?? 0) - (a.other?.createdAt.getTime() ?? 0));
  }, []);
}

export type DecideVerb = "confirm" | "dismiss" | "reopen";
export type DecideResult = { ok: true; status: DuplicateStatus } | { ok: false; reason: "not_found" | "forbidden" | "stale" | "not_installed" };

const TO: Record<DecideVerb, DuplicateStatus> = { confirm: "confirmed", dismiss: "dismissed", reopen: "suggested" };

// expected is the status the reviewer saw, so two people deciding at once
// cannot overwrite each other.
export async function decideMatch(
  db: Db,
  staff: Staff,
  input: { readonly matchId: string; readonly verb: DecideVerb; readonly expected: DuplicateStatus },
): Promise<DecideResult> {
  if (!UUID.test(input.matchId)) return { ok: false, reason: "not_found" };
  try {
    return await db.transaction(async (tx): Promise<DecideResult> => {
      const [row] = await tx.select().from(duplicateMatches).where(eq(duplicateMatches.id, input.matchId)).for("update");
      if (!row) return { ok: false, reason: "not_found" };
      if (!canDecide(staff.role, row.list)) return { ok: false, reason: "forbidden" };
      if (row.status !== input.expected) return { ok: false, reason: "stale" };
      const to = TO[input.verb];
      if (to === row.status) return { ok: true, status: to };
      const decided = to !== "suggested";
      await tx
        .update(duplicateMatches)
        .set({ status: to, decidedBy: decided ? staff.id : null, decidedAt: decided ? new Date() : null, automatic: false })
        .where(eq(duplicateMatches.id, row.id));
      await recordEvent(tx, staff.id, { kind: "duplicate.decided", list: row.list, recordId: row.recordId, originalId: row.originalId, from: row.status, to });
      return { ok: true, status: to };
    });
  } catch (err) {
    if (isMissingTable(err)) return { ok: false, reason: "not_installed" };
    throw err;
  }
}

/** Total entries in a list, for "N entries · M people". */
export async function entryTotal(db: Store, list: DuplicateList): Promise<number> {
  const table = list === "applicants" ? applicants : list === "partners" ? partnerInquiries : contactMessages;
  const [row] = await db.select({ n: count() }).from(table);
  return row?.n ?? 0;
}
