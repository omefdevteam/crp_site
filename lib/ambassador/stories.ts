import { randomUUID } from "node:crypto";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { stories, storyEvents, type Db, type Story, type StoryStatus, type Tx } from "@/lib/db";
import { placeById } from "@/lib/places/search";
import type { Member } from "@/lib/ambassador/auth";
import type { StoryPhotoStore } from "@/lib/ambassador/photo-store";
import {
  DELETABLE,
  PENDING_MAX,
  PHOTO_EXT,
  PHOTO_MAX_BYTES,
  STORIES_MAX,
  SUBMITTABLE,
  WITHDRAWABLE,
  canEdit,
  missingForSubmit,
  sniffPhoto,
  type MissingPart,
  type StoryDraft,
} from "@/lib/ambassador/story-model";

// An Ambassador's own stories. Every write locks the story row, checks it
// belongs to this Ambassador, checks the version the form was built from, and
// writes a story_events row for each status change, all in one transaction.

export type StoryFailure =
  | { readonly reason: "not_found" | "locked" | "stale" | "limit" | "pending_limit" | "place" | "photo_type" | "photo_size" | "no_store" }
  | { readonly reason: "incomplete"; readonly missing: readonly MissingPart[] };

export type StoryResult<T = { id: string }> = ({ readonly ok: true } & T) | ({ readonly ok: false } & StoryFailure);

export async function listMyStories(db: Db, ambassadorId: string): Promise<Story[]> {
  return db.select().from(stories).where(eq(stories.ambassadorId, ambassadorId)).orderBy(desc(stories.updatedAt));
}

export async function getMyStory(db: Db, ambassadorId: string, storyId: string): Promise<Story | null> {
  if (!isUuid(storyId)) return null;
  const [row] = await db.select().from(stories).where(and(eq(stories.id, storyId), eq(stories.ambassadorId, ambassadorId)));
  return row ?? null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: string): boolean {
  return UUID.test(value);
}

async function lockMine(tx: Tx, ambassadorId: string, storyId: string): Promise<Story | null> {
  if (!isUuid(storyId)) return null;
  const [row] = await tx
    .select()
    .from(stories)
    .where(and(eq(stories.id, storyId), eq(stories.ambassadorId, ambassadorId)))
    .for("update");
  return row ?? null;
}

async function logStatus(tx: Tx, storyId: string, from: StoryStatus | null, to: StoryStatus, reason: string | null = null) {
  await tx.insert(storyEvents).values({ storyId, actor: "ambassador", fromStatus: from, toStatus: to, reason });
}

function placeColumns(draft: StoryDraft) {
  if (draft.placeId === null) return { ok: true as const, columns: { country: null, city: null, lat: null, lng: null } };
  const place = placeById(draft.placeId);
  if (!place) return { ok: false as const };
  return { ok: true as const, columns: { country: place.country, city: place.name, lat: place.lat, lng: place.lng } };
}

// Creates a draft (storyId null) or saves changes to one. Saving a rejected or
// withdrawn story makes it a draft again.
export async function saveStory(
  db: Db,
  member: Member,
  storyId: string | null,
  draft: StoryDraft,
  expectedVersion: number | null,
): Promise<StoryResult> {
  const place = placeColumns(draft);
  if (!place.ok) return { ok: false, reason: "place" };
  const values = { kind: draft.kind, title: draft.title, body: draft.body, language: draft.language, ...place.columns };
  return db.transaction(async (tx): Promise<StoryResult> => {
    if (storyId === null) {
      const [{ total }] = await tx.select({ total: count() }).from(stories).where(eq(stories.ambassadorId, member.id));
      if (total >= STORIES_MAX) return { ok: false, reason: "limit" };
      const [created] = await tx.insert(stories).values({ ambassadorId: member.id, ...values }).returning({ id: stories.id });
      await logStatus(tx, created.id, null, "draft");
      return { ok: true, id: created.id };
    }
    const current = await lockMine(tx, member.id, storyId);
    if (!current) return { ok: false, reason: "not_found" };
    if (!canEdit(current.status)) return { ok: false, reason: "locked" };
    if (expectedVersion !== null && expectedVersion !== current.version) return { ok: false, reason: "stale" };
    await tx
      .update(stories)
      .set({ ...values, status: "draft", version: current.version + 1 })
      .where(eq(stories.id, current.id));
    if (current.status !== "draft") await logStatus(tx, current.id, current.status, "draft");
    return { ok: true, id: current.id };
  });
}

export async function submitStory(db: Db, member: Member, storyId: string, expectedVersion: number | null): Promise<StoryResult> {
  return db.transaction(async (tx): Promise<StoryResult> => {
    const current = await lockMine(tx, member.id, storyId);
    if (!current) return { ok: false, reason: "not_found" };
    if (!SUBMITTABLE.includes(current.status)) return { ok: false, reason: "locked" };
    if (expectedVersion !== null && expectedVersion !== current.version) return { ok: false, reason: "stale" };
    const missing = missingForSubmit(current);
    if (missing.length > 0) return { ok: false, reason: "incomplete", missing };
    const [{ pending }] = await tx
      .select({ pending: count() })
      .from(stories)
      .where(and(eq(stories.ambassadorId, member.id), eq(stories.status, "submitted")));
    if (pending >= PENDING_MAX) return { ok: false, reason: "pending_limit" };
    await tx
      .update(stories)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        reviewReason: null,
        publishedAt: null,
        version: current.version + 1,
      })
      .where(eq(stories.id, current.id));
    await logStatus(tx, current.id, current.status, "submitted");
    return { ok: true, id: current.id };
  });
}

// Takes a story out of the review queue, or off the globe. It can then be
// edited and sent again.
export async function withdrawStory(db: Db, member: Member, storyId: string): Promise<StoryResult> {
  return db.transaction(async (tx): Promise<StoryResult> => {
    const current = await lockMine(tx, member.id, storyId);
    if (!current) return { ok: false, reason: "not_found" };
    if (!WITHDRAWABLE.includes(current.status)) return { ok: false, reason: "locked" };
    await tx
      .update(stories)
      .set({ status: "withdrawn", publishedAt: null, version: current.version + 1 })
      .where(eq(stories.id, current.id));
    await logStatus(tx, current.id, current.status, "withdrawn");
    return { ok: true, id: current.id };
  });
}

// Deletes a story that is not live and not waiting for review, then its photo.
export async function deleteStory(db: Db, member: Member, storyId: string, store: StoryPhotoStore | null): Promise<StoryResult> {
  const result = await db.transaction(async (tx): Promise<StoryResult<{ id: string; photo: string | null }>> => {
    const current = await lockMine(tx, member.id, storyId);
    if (!current) return { ok: false, reason: "not_found" };
    if (!DELETABLE.includes(current.status)) return { ok: false, reason: "locked" };
    await tx.delete(stories).where(eq(stories.id, current.id));
    return { ok: true, id: current.id, photo: current.photoPathname };
  });
  if (result.ok && result.photo && store) await store.remove(result.photo).catch(() => undefined);
  return result.ok ? { ok: true, id: result.id } : result;
}

export type PhotoFile = { readonly bytes: Uint8Array; readonly size: number };

// Stores a new photo, then points the story at it in a locked update. The old
// photo is removed only after the row has moved on, so a failure never leaves
// a story pointing at a missing file.
export async function setStoryPhoto(
  db: Db,
  member: Member,
  storyId: string,
  store: StoryPhotoStore | null,
  file: PhotoFile,
): Promise<StoryResult> {
  if (!store) return { ok: false, reason: "no_store" };
  if (file.size <= 0 || file.size > PHOTO_MAX_BYTES || file.bytes.length !== file.size) return { ok: false, reason: "photo_size" };
  const type = sniffPhoto(file.bytes);
  if (!type) return { ok: false, reason: "photo_type" };
  const story = await getMyStory(db, member.id, storyId);
  if (!story) return { ok: false, reason: "not_found" };
  if (!canEdit(story.status)) return { ok: false, reason: "locked" };
  const pathname = `story-photos/${story.id}/${randomUUID()}.${PHOTO_EXT[type]}`;
  await store.put(pathname, file.bytes, type);
  const result = await db.transaction(async (tx): Promise<StoryResult<{ id: string; old: string | null }>> => {
    const current = await lockMine(tx, member.id, storyId);
    if (!current) return { ok: false, reason: "not_found" };
    if (!canEdit(current.status)) return { ok: false, reason: "locked" };
    await tx
      .update(stories)
      .set({
        photoPathname: pathname,
        photoContentType: type,
        photoByteSize: file.size,
        status: "draft",
        version: current.version + 1,
      })
      .where(eq(stories.id, current.id));
    if (current.status !== "draft") await logStatus(tx, current.id, current.status, "draft");
    return { ok: true, id: current.id, old: current.photoPathname };
  });
  if (!result.ok) {
    await store.remove(pathname).catch(() => undefined);
    return result;
  }
  if (result.old) await store.remove(result.old).catch(() => undefined);
  return { ok: true, id: result.id };
}

export async function removeStoryPhoto(db: Db, member: Member, storyId: string, store: StoryPhotoStore | null): Promise<StoryResult> {
  const result = await db.transaction(async (tx): Promise<StoryResult<{ id: string; old: string | null }>> => {
    const current = await lockMine(tx, member.id, storyId);
    if (!current) return { ok: false, reason: "not_found" };
    if (!canEdit(current.status)) return { ok: false, reason: "locked" };
    await tx
      .update(stories)
      .set({ photoPathname: null, photoContentType: null, photoByteSize: null, status: "draft", version: current.version + 1 })
      .where(eq(stories.id, current.id));
    if (current.status !== "draft") await logStatus(tx, current.id, current.status, "draft");
    return { ok: true, id: current.id, old: current.photoPathname };
  });
  if (result.ok && result.old && store) await store.remove(result.old).catch(() => undefined);
  return result.ok ? { ok: true, id: result.id } : result;
}

export type PhotoViewer = { readonly kind: "public" } | { readonly kind: "member"; readonly ambassadorId: string } | { readonly kind: "staff" };

// Which photo a viewer may see. The public sees approved stories only.
export async function photoFor(
  db: Db,
  storyId: string,
  viewer: PhotoViewer,
): Promise<{ pathname: string; contentType: string; byteSize: number; public: boolean } | null> {
  if (!isUuid(storyId)) return null;
  const [row] = await db
    .select({
      ambassadorId: stories.ambassadorId,
      status: stories.status,
      pathname: stories.photoPathname,
      contentType: stories.photoContentType,
      byteSize: stories.photoByteSize,
    })
    .from(stories)
    .where(eq(stories.id, storyId));
  if (!row?.pathname || !row.contentType || row.byteSize == null) return null;
  const isPublic = row.status === "approved";
  const allowed = isPublic
    || viewer.kind === "staff"
    || (viewer.kind === "member" && viewer.ambassadorId === row.ambassadorId);
  if (!allowed) return null;
  return { pathname: row.pathname, contentType: row.contentType, byteSize: row.byteSize, public: isPublic };
}

export async function countByStatus(db: Db, ambassadorId: string): Promise<Partial<Record<StoryStatus, number>>> {
  const rows = await db
    .select({ status: stories.status, n: count() })
    .from(stories)
    .where(and(eq(stories.ambassadorId, ambassadorId), inArray(stories.status, ["draft", "submitted", "approved", "rejected", "withdrawn"])))
    .groupBy(stories.status);
  return Object.fromEntries(rows.map((row) => [row.status, row.n]));
}
