import { and, asc, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { appUrl } from "@/lib/config";
import { recordEvent } from "@/lib/admin/events";
import { ambassadors, applicants, stories, storyEvents, users, type Db, type Story, type StoryStatus, type Tx } from "@/lib/db";
import { storyApprovedEmail, storyChangesEmail } from "@/lib/emails";
import { enqueueEmail } from "@/lib/jobs";
import { parseLocale } from "@/lib/locale";
import { placeById } from "@/lib/places/search";
import type { StaffGrant } from "@/lib/staff/auth";
import { memberPath } from "@/lib/ambassador/link";
import { AMBASSADOR_STATUSES } from "@/lib/ambassador/status";
import { isUuid } from "@/lib/ambassador/stories";

// Staff review of Ambassador stories. A story reaches the globe only through
// approve. Every decision locks the story row, checks the version the reviewer
// was looking at, writes a story_events row and an admin_events row, and
// queues the Ambassador's email, all in one transaction.

export const REVIEW_REASON_MAX = 500;

export const REVIEW_VERBS = ["approve", "reject", "takedown", "move"] as const;
export type ReviewVerb = (typeof REVIEW_VERBS)[number];

export function isReviewVerb(value: string): value is ReviewVerb {
  return (REVIEW_VERBS as readonly string[]).includes(value);
}

// Which status each decision starts from.
const FROM: Record<ReviewVerb, readonly StoryStatus[]> = {
  approve: ["submitted"],
  reject: ["submitted"],
  takedown: ["approved"],
  move: ["submitted", "approved"],
};

export function allowedVerbs(status: StoryStatus): ReviewVerb[] {
  return REVIEW_VERBS.filter((verb) => FROM[verb].includes(status));
}

export type ReviewCommand = {
  readonly storyId: string;
  readonly verb: ReviewVerb;
  readonly expectedVersion: number;
  readonly reason?: string;
  readonly placeId?: number | null;
};

export type ReviewFailure = "not_found" | "stale" | "not_allowed" | "reason" | "place";
export type ReviewResult = { ok: true; status: StoryStatus } | { ok: false; reason: ReviewFailure };

export function cleanReason(raw: string | undefined): string | null {
  const text = String(raw ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text || [...text].length > REVIEW_REASON_MAX) return null;
  return text;
}

async function queueOutcome(tx: Tx, story: Story, verb: "approve" | "reject" | "takedown", reason: string | null, version: number) {
  const [owner] = await tx
    .select({ email: ambassadors.email, name: ambassadors.displayName, language: ambassadors.language, applicantId: ambassadors.applicantId })
    .from(ambassadors)
    .where(eq(ambassadors.id, story.ambassadorId));
  if (!owner) return;
  const locale = parseLocale(owner.language);
  const title = story.title ?? "";
  const mail = verb === "approve"
    ? storyApprovedEmail(locale, owner.name, title, `${appUrl()}/${locale}`)
    : storyChangesEmail(locale, owner.name, title, reason ?? "", verb === "takedown", `${appUrl()}${memberPath(locale, `/stories/${story.id}`)}`);
  await enqueueEmail(tx, `story-review:${story.id}:${version}`, { to: owner.email, ...mail }, `story_${verb}`, owner.applicantId);
}

export async function reviewStory(db: Db, staff: StaffGrant<"stories.review">, command: ReviewCommand): Promise<ReviewResult> {
  if (!isUuid(command.storyId)) return { ok: false, reason: "not_found" };
  const needsReason = command.verb === "reject" || command.verb === "takedown";
  const reason = needsReason ? cleanReason(command.reason) : null;
  if (needsReason && !reason) return { ok: false, reason: "reason" };
  const place = command.verb === "move" ? placeById(command.placeId ?? -1) : null;
  if (command.verb === "move" && !place) return { ok: false, reason: "place" };

  return db.transaction(async (tx): Promise<ReviewResult> => {
    const [current] = await tx.select().from(stories).where(eq(stories.id, command.storyId)).for("update");
    if (!current) return { ok: false, reason: "not_found" };
    if (current.version !== command.expectedVersion) return { ok: false, reason: "stale" };
    if (!FROM[command.verb].includes(current.status)) return { ok: false, reason: "not_allowed" };
    const version = current.version + 1;
    const now = new Date();

    if (command.verb === "move") {
      await tx
        .update(stories)
        .set({ country: place!.country, city: place!.name, lat: place!.lat, lng: place!.lng, version })
        .where(eq(stories.id, current.id));
      await recordEvent(tx, staff.id, { kind: "story.moved", storyId: current.id, from: current.city ?? "", to: place!.name });
      return { ok: true, status: current.status };
    }

    const to: StoryStatus = command.verb === "approve" ? "approved" : "rejected";
    await tx
      .update(stories)
      .set({
        status: to,
        reviewedAt: now,
        reviewedBy: staff.id,
        reviewReason: reason,
        publishedAt: to === "approved" ? now : null,
        version,
      })
      .where(eq(stories.id, current.id));
    await tx.insert(storyEvents).values({
      storyId: current.id,
      actor: "staff",
      actorStaffId: staff.id,
      fromStatus: current.status,
      toStatus: to,
      reason,
    });
    await recordEvent(tx, staff.id, { kind: "story.reviewed", storyId: current.id, verb: command.verb, from: current.status, to });
    await queueOutcome(tx, current, command.verb, reason, version);
    return { ok: true, status: to };
  });
}

// ---- Reading ----

export const QUEUE_FILTERS = ["submitted", "approved", "rejected", "all"] as const;
export type QueueFilter = (typeof QUEUE_FILTERS)[number];

export function parseQueueFilter(value: string | undefined): QueueFilter {
  return (QUEUE_FILTERS as readonly string[]).includes(value ?? "") ? (value as QueueFilter) : "submitted";
}

export type QueueRow = {
  readonly id: string;
  readonly kind: Story["kind"];
  readonly status: StoryStatus;
  readonly title: string | null;
  readonly city: string | null;
  readonly country: string | null;
  readonly language: string;
  readonly submittedAt: Date | null;
  readonly updatedAt: Date;
  readonly hasPhoto: boolean;
  readonly author: string;
};

// Drafts and withdrawn stories are the Ambassador's own business; staff see
// only what was sent to them.
const VISIBLE: readonly StoryStatus[] = ["submitted", "approved", "rejected"];

export async function listForReview(db: Db, filter: QueueFilter, limit = 200): Promise<QueueRow[]> {
  const where: SQL = filter === "all" ? inArray(stories.status, [...VISIBLE]) : eq(stories.status, filter);
  const rows = await db
    .select({
      id: stories.id,
      kind: stories.kind,
      status: stories.status,
      title: stories.title,
      city: stories.city,
      country: stories.country,
      language: stories.language,
      submittedAt: stories.submittedAt,
      updatedAt: stories.updatedAt,
      photo: stories.photoPathname,
      author: ambassadors.displayName,
    })
    .from(stories)
    .innerJoin(ambassadors, eq(ambassadors.id, stories.ambassadorId))
    .where(where)
    // The queue is first come, first served; the other lists show newest first.
    .orderBy(filter === "submitted" ? asc(stories.submittedAt) : desc(stories.updatedAt))
    .limit(limit);
  return rows.map(({ photo, ...row }) => ({ ...row, hasPhoto: Boolean(photo) }));
}

export async function countWaiting(db: Db): Promise<number> {
  const [row] = await db.select({ n: count() }).from(stories).where(eq(stories.status, "submitted"));
  return row?.n ?? 0;
}

export type ReviewDetail = Story & {
  readonly author: { readonly name: string; readonly email: string; readonly applicantId: string; readonly active: boolean };
  readonly history: readonly { readonly at: Date; readonly actor: "ambassador" | "staff"; readonly staff: string | null; readonly from: StoryStatus | null; readonly to: StoryStatus; readonly reason: string | null }[];
};

export async function loadForReview(db: Db, storyId: string): Promise<ReviewDetail | null> {
  if (!isUuid(storyId)) return null;
  const [row] = await db
    .select({
      story: stories,
      name: ambassadors.displayName,
      email: ambassadors.email,
      applicantId: ambassadors.applicantId,
      disabledAt: ambassadors.disabledAt,
      applicantStatus: applicants.status,
    })
    .from(stories)
    .innerJoin(ambassadors, eq(ambassadors.id, stories.ambassadorId))
    .innerJoin(applicants, eq(applicants.id, ambassadors.applicantId))
    .where(and(eq(stories.id, storyId), inArray(stories.status, [...VISIBLE])));
  if (!row) return null;
  const history = await db
    .select({
      at: storyEvents.createdAt,
      actor: storyEvents.actor,
      staff: users.email,
      from: storyEvents.fromStatus,
      to: storyEvents.toStatus,
      reason: storyEvents.reason,
    })
    .from(storyEvents)
    .leftJoin(users, eq(users.id, storyEvents.actorStaffId))
    .where(eq(storyEvents.storyId, storyId))
    .orderBy(desc(storyEvents.createdAt));
  return {
    ...row.story,
    author: {
      name: row.name,
      email: row.email,
      applicantId: row.applicantId,
      active: !row.disabledAt && (AMBASSADOR_STATUSES as readonly string[]).includes(row.applicantStatus),
    },
    history,
  };
}
