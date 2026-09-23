import { and, asc, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import {
  applicants,
  applicationEvents,
  jobs,
  webhookEvents,
  type Db,
} from "@/lib/db";
import { retryJob } from "@/lib/jobs";
import { lockApplicant, transition, STATUSES, type Actor, type Status } from "@/lib/lifecycle";
import { requestResumeLink, scheduleIdentitySession } from "@/lib/application";

// What the team sees instead of server logs: who is stuck where, which emails
// did not go out, which webhooks never arrived, and which reviews have stalled.
// Every list is bounded and ordered oldest-first so the longest wait is on top.

const HOUR = 3600_000;
const DAY = 24 * HOUR;

const applicantSummary = {
  id: applicants.id,
  fullName: applicants.fullName,
  email: applicants.email,
  status: applicants.status,
  track: applicants.track,
  identityStatus: applicants.identityStatus,
  identityLink: applicants.identityLink,
  version: applicants.version,
  createdAt: applicants.createdAt,
  updatedAt: applicants.updatedAt,
};

export async function overview(db: Db, limit = 50) {
  const now = Date.now();
  const [awaitingIdentity, identityReview, failedEmails, failedJobs, missingCallbacks, stalledReviews, unprocessedWebhooks, counts] = await Promise.all([
    // Round 1 done, no verified/failed result yet.
    db.select(applicantSummary).from(applicants)
      .where(and(eq(applicants.status, "round1_complete"), lt(applicants.updatedAt, new Date(now - HOUR))))
      .orderBy(asc(applicants.updatedAt)).limit(limit),
    // The provider asked a human to look.
    db.select(applicantSummary).from(applicants)
      .where(eq(applicants.identityStatus, "review"))
      .orderBy(asc(applicants.updatedAt)).limit(limit),
    // Emails the worker gave up on, or that Resend later bounced.
    db.select().from(jobs)
      .where(and(eq(jobs.kind, "email"), sql`(${jobs.status} = 'failed' or ${jobs.deliveryStatus} in ('bounced', 'complained', 'delivery_delayed'))`))
      .orderBy(asc(jobs.updatedAt)).limit(limit),
    // Non-email work that is parked.
    db.select().from(jobs)
      .where(and(eq(jobs.status, "failed"), sql`${jobs.kind} <> 'email'`))
      .orderBy(asc(jobs.updatedAt)).limit(limit),
    // Applicants sent to Round 1 or to the identity check a while ago whose
    // completion webhook never came.
    db.select(applicantSummary).from(applicants)
      .where(sql`(${applicants.status} = 'submitted' and ${applicants.createdAt} < ${new Date(now - 3 * DAY)})
        or (${applicants.identityLink} is not null and ${applicants.identityStatus} = 'pending' and ${applicants.updatedAt} < ${new Date(now - DAY)})`)
      .orderBy(asc(applicants.updatedAt)).limit(limit),
    // Waiting on the team: identity resolved or Round 1 done, no review decision.
    db.select(applicantSummary).from(applicants)
      .where(and(inArray(applicants.status, ["id_verified", "id_failed", "docs_submitted"]), isNull(applicants.reviewDecision), lt(applicants.updatedAt, new Date(now - 7 * DAY))))
      .orderBy(asc(applicants.updatedAt)).limit(limit),
    db.select().from(webhookEvents)
      .where(isNull(webhookEvents.processedAt))
      .orderBy(asc(webhookEvents.createdAt)).limit(limit),
    db.select({ status: applicants.status, count: sql<number>`count(*)::int` }).from(applicants).groupBy(applicants.status),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    counts: Object.fromEntries(counts.map((c) => [c.status, c.count])),
    awaitingIdentity,
    identityReview,
    failedEmails,
    failedJobs,
    missingCallbacks,
    stalledReviews,
    unprocessedWebhooks,
  };
}

export async function applicantDetail(db: Db, applicantId: string) {
  const [applicant] = await db.select().from(applicants).where(eq(applicants.id, applicantId));
  if (!applicant) return null;
  const [history, work] = await Promise.all([
    db.select().from(applicationEvents).where(eq(applicationEvents.applicantId, applicantId)).orderBy(desc(applicationEvents.createdAt)).limit(100),
    db.select().from(jobs).where(eq(jobs.applicantId, applicantId)).orderBy(desc(jobs.createdAt)).limit(100),
  ]);
  return { applicant, history, jobs: work };
}

export type OpsAction =
  | { action: "retry_job"; jobId: string }
  | { action: "provision_identity"; applicantId: string }
  | { action: "send_resume_link"; applicantId: string }
  | { action: "transition"; applicantId: string; to: Status; reason: string; expectedVersion?: number };

export type OpsActionResult = { ok: boolean; detail: string };

// The controlled set of things the team may do from the screen. Each one goes
// through the same lifecycle rules as the automated paths and is attributed to
// the operator in the history.
export async function performAction(db: Db, input: OpsAction, operator: string): Promise<OpsActionResult> {
  switch (input.action) {
    case "retry_job": {
      return db.transaction(async (tx) => {
        const ok = await retryJob(tx, input.jobId);
        if (ok) await tx.insert(applicationEvents).values({ actor: "ops", reason: `job ${input.jobId} requeued by ${operator}` });
        return { ok, detail: ok ? "job requeued" : "job not found" };
      });
    }
    case "provision_identity": {
      return db.transaction(async (tx) => {
        const current = await lockApplicant(tx, input.applicantId);
        if (!current) return { ok: false, detail: "applicant not found" };
        if (!["round1_complete", "id_failed"].includes(current.status)) {
          return { ok: false, detail: `applicant is ${current.status}; identity check not due` };
        }
        // Reset the job so the worker will (re)provision even if a prior run finished.
        await tx.delete(jobs).where(eq(jobs.dedupeKey, `identity_session:${current.id}`));
        await scheduleIdentitySession(tx, current.id);
        await tx.insert(applicationEvents).values({ applicantId: current.id, fromStatus: current.status, toStatus: current.status, actor: "ops", reason: `identity session (re)provisioned by ${operator}`, version: current.version });
        return { ok: true, detail: "identity provisioning queued" };
      });
    }
    case "send_resume_link": {
      const [current] = await db.select({ email: applicants.email }).from(applicants).where(eq(applicants.id, input.applicantId));
      if (!current) return { ok: false, detail: "applicant not found" };
      await requestResumeLink(db, current.email);
      await db.insert(applicationEvents).values({ applicantId: input.applicantId, actor: "ops", reason: `resume link sent by ${operator}` });
      return { ok: true, detail: "resume link queued" };
    }
    case "transition": {
      if (!STATUSES.includes(input.to)) return { ok: false, detail: "unknown status" };
      const patch =
        input.to === "round1_complete" ? { round1CompletedAt: new Date() }
        : input.to === "docs_submitted" ? { docsStatus: "submitted" as const }
        : input.to === "id_verified" ? { identityStatus: "verified" as const, identityCheckedAt: new Date() }
        : undefined;
      const result = await db.transaction((tx) => transition(tx, {
        applicantId: input.applicantId,
        to: input.to,
        actor: "ops" satisfies Actor,
        reason: `${input.reason} (by ${operator})`,
        expectedVersion: input.expectedVersion,
        patch,
      }));
      return result.ok
        ? { ok: true, detail: `${result.from} → ${result.to} (v${result.version})` }
        : { ok: false, detail: `refused: ${result.code}` };
    }
  }
}
