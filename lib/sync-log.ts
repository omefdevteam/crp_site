import { and, asc, eq, gt, sql } from "drizzle-orm";
import { syncChanges, syncClock, type Store } from "@/lib/db";

export type SyncTable = "applicants" | "waitlist" | "interest" | "nominations";
export type SyncOperation = "insert" | "update";

// Appends one row to the durable change feed inside the caller's transaction.
// Bumping the singleton clock row takes its row lock, so concurrent writers
// commit in revision order and a consumer paging by revision never skips one.
export async function recordChange(
  tx: Store,
  tableName: SyncTable,
  recordId: string,
  operation: SyncOperation,
  payload: Record<string, unknown>,
): Promise<bigint> {
  await tx.insert(syncClock).values({ singleton: true }).onConflictDoNothing();
  const [clock] = await tx
    .update(syncClock)
    .set({ revision: sql`${syncClock.revision} + 1` })
    .where(eq(syncClock.singleton, true))
    .returning({ revision: syncClock.revision });
  await tx.insert(syncChanges).values({
    revision: clock.revision,
    tableName,
    recordId,
    operation,
    payload,
  });
  return clock.revision;
}

// Pages the change feed the same way GET /api/sync does: strictly after the
// caller's cursor, in revision order, one extra row to detect another page.
export async function pageChanges(db: Store, tableName: SyncTable, after: bigint, limit: number) {
  const rows = await db
    .select()
    .from(syncChanges)
    .where(and(eq(syncChanges.tableName, tableName), gt(syncChanges.revision, after)))
    .orderBy(asc(syncChanges.revision))
    .limit(limit + 1);
  const page = rows.slice(0, limit);
  return {
    rows: page,
    cursor: page.at(-1)?.revision ?? after,
    hasMore: rows.length > limit,
  };
}
