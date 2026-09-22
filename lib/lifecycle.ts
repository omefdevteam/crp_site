import { and, eq } from "drizzle-orm";
import {
  applicants,
  applicationEvents,
  applicantStatus,
  type Applicant,
  type NewApplicant,
  type Store,
} from "@/lib/db";
import { applicantSyncRow } from "@/lib/sync";
import { recordChange } from "@/lib/sync-log";

export type Status = Applicant["status"];
export const STATUSES = applicantStatus.enumValues;

// Who caused a change. Recorded on every event so the history reads as a story.
export type Actor = "applicant" | "videoask" | "identity" | "excel" | "ops" | "system";

// The one place the pipeline is defined. A status may only move to a status
// listed here; everything else (webhooks, the review sheet, ops tools) asks
// `transition` and gets refused otherwise.
//
//  submitted ─▶ round1_complete ─▶ id_verified/id_failed ─▶ accepted/rejected
//    ─▶ interview_yes/interview_no ─▶ docs_submitted ─▶ onboarding ⇄ online
//
// Review decisions may also land before Round 1 finishes (the team can review
// early), corrections within a stage are allowed, `ineligible` is reachable
// from anywhere, and ops can reopen an ineligible applicant to `submitted`.
export const TRANSITIONS: Record<Status, readonly Status[]> = {
  submitted: ["round1_complete", "accepted", "rejected", "ineligible"],
  round1_complete: ["id_verified", "id_failed", "accepted", "rejected", "ineligible"],
  id_verified: ["accepted", "rejected", "ineligible"],
  id_failed: ["id_verified", "accepted", "rejected", "ineligible"],
  accepted: ["rejected", "interview_yes", "interview_no", "ineligible"],
  rejected: ["accepted", "interview_yes", "interview_no", "ineligible"],
  interview_yes: ["interview_no", "docs_submitted", "ineligible"],
  interview_no: ["interview_yes", "online", "ineligible"],
  docs_submitted: ["onboarding", "online", "ineligible"],
  onboarding: ["online", "ineligible"],
  online: ["onboarding", "ineligible"],
  ineligible: ["submitted"],
};

// Travelling ambassadors must have passed the identity check before they are
// onboarded. The online track has no travel documents, so it is exempt.
export function requiresVerifiedIdentity(applicant: Pick<Applicant, "track" | "identityStatus">, to: Status): boolean {
  return to === "onboarding" && applicant.track === "in_person" && applicant.identityStatus !== "verified";
}

export type TransitionInput = {
  applicantId: string;
  to: Status;
  actor: Actor;
  reason: string;
  // Narrow the allowed sources further than TRANSITIONS (e.g. review-sheet rules).
  allowFrom?: readonly Status[];
  // Columns written in the same statement as the status change.
  patch?: Partial<NewApplicant>;
  // Optimistic guard: refuse when the caller's view is older than the row.
  expectedVersion?: number;
};

export type TransitionFailure = "not_found" | "not_allowed" | "stale" | "identity_required" | "noop";

export type TransitionResult =
  | { ok: true; from: Status; to: Status; version: number; applicant: Applicant }
  | { ok: false; code: TransitionFailure; applicant?: Applicant };

// Row-locks the applicant for the rest of the transaction so two webhooks or a
// webhook and a decision poll cannot interleave their read-then-write.
export async function lockApplicant(tx: Store, applicantId: string): Promise<Applicant | undefined> {
  const [row] = await tx.select().from(applicants).where(eq(applicants.id, applicantId)).for("update");
  return row;
}

// Moves an applicant between statuses, bumps the version, writes the history
// row, and appends the change to the sync feed — all in the caller's transaction.
export async function transition(tx: Store, input: TransitionInput): Promise<TransitionResult> {
  const current = await lockApplicant(tx, input.applicantId);
  if (!current) return { ok: false, code: "not_found" };
  if (input.expectedVersion !== undefined && input.expectedVersion < current.version) {
    return { ok: false, code: "stale", applicant: current };
  }
  if (current.status === input.to) return { ok: false, code: "noop", applicant: current };
  if (!TRANSITIONS[current.status].includes(input.to)) return { ok: false, code: "not_allowed", applicant: current };
  if (input.allowFrom && !input.allowFrom.includes(current.status)) return { ok: false, code: "not_allowed", applicant: current };
  if (requiresVerifiedIdentity({ ...current, ...input.patch }, input.to)) {
    return { ok: false, code: "identity_required", applicant: current };
  }

  const [updated] = await tx
    .update(applicants)
    .set({ ...input.patch, status: input.to, version: current.version + 1 })
    .where(and(eq(applicants.id, current.id), eq(applicants.version, current.version)))
    .returning();
  if (!updated) return { ok: false, code: "stale", applicant: current };

  await tx.insert(applicationEvents).values({
    applicantId: current.id,
    fromStatus: current.status,
    toStatus: input.to,
    actor: input.actor,
    reason: input.reason,
    version: updated.version,
  });
  await recordChange(tx, "applicants", current.id, "update", applicantSyncRow(updated));
  return { ok: true, from: current.status, to: input.to, version: updated.version, applicant: updated };
}

// A non-status write (decision columns, identity session details). Bumps the
// version and records the change so the Excel mirror sees it, but writes no
// history row because the pipeline stage did not move.
export async function updateApplicant(
  tx: Store,
  applicantId: string,
  patch: Partial<NewApplicant>,
): Promise<Applicant | undefined> {
  const current = await lockApplicant(tx, applicantId);
  if (!current) return undefined;
  const [updated] = await tx
    .update(applicants)
    .set({ ...patch, version: current.version + 1 })
    .where(and(eq(applicants.id, current.id), eq(applicants.version, current.version)))
    .returning();
  if (!updated) return undefined;
  await recordChange(tx, "applicants", current.id, "update", applicantSyncRow(updated));
  return updated;
}

// The creation event: no previous state, version 0.
export async function recordCreation(tx: Store, applicant: Applicant, actor: Actor, reason: string): Promise<void> {
  await tx.insert(applicationEvents).values({
    applicantId: applicant.id,
    fromStatus: null,
    toStatus: applicant.status,
    actor,
    reason,
    version: applicant.version,
  });
  await recordChange(tx, "applicants", applicant.id, "insert", applicantSyncRow(applicant));
}
