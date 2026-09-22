import { createHash } from "crypto";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { applicants, jobs, webhookEvents, type Db, type JobPayload } from "@/lib/db";
import { withApplicantId, videoAskBase } from "@/lib/capture";
import { decisionEmail } from "@/lib/emails";
import { getIdentityProvider, type IdentityDecision } from "@/lib/identity";
import { enqueue, enqueueEmail } from "@/lib/jobs";
import { lockApplicant, transition, updateApplicant } from "@/lib/lifecycle";
import { reconcileIdentity } from "@/lib/application-status";
import { scheduleIdentitySession } from "@/lib/application";

// Every verified webhook is written down before anything acts on it. The
// (provider, event key) pair is unique, so a redelivery is recognised and
// answered without a second processing run; a delivery whose processing fails
// stays on record and is retried by the worker.
export type WebhookProvider = "videoask" | "identity" | "resend";
export type WebhookEvent = typeof webhookEvents.$inferSelect;

export function bodyHash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function recordWebhookEvent(
  db: Db,
  provider: WebhookProvider,
  eventKey: string,
  payload: JobPayload,
): Promise<{ id: string; duplicate: boolean }> {
  const [inserted] = await db
    .insert(webhookEvents)
    .values({ provider, eventKey, payload })
    .onConflictDoNothing({ target: [webhookEvents.provider, webhookEvents.eventKey] })
    .returning({ id: webhookEvents.id });
  if (inserted) return { id: inserted.id, duplicate: false };
  const [existing] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(and(eq(webhookEvents.provider, provider), eq(webhookEvents.eventKey, eventKey)));
  return { id: existing.id, duplicate: true };
}

export type ProcessOutcome = { outcome: string; advanced?: boolean; status?: string };

// Runs the provider-specific handler in one transaction and stamps the event.
// Throws on infrastructure failure so the caller can queue a retry; a business
// refusal (unknown applicant, stale event) is a recorded outcome, not an error.
export async function processWebhookEvent(db: Db, eventId: string): Promise<ProcessOutcome> {
  return db.transaction(async (tx) => {
    const [event] = await tx.select().from(webhookEvents).where(eq(webhookEvents.id, eventId)).for("update");
    if (!event) return { outcome: "missing" };
    if (event.processedAt) return { outcome: event.outcome ?? "processed" };

    const result = await dispatch(tx, event);
    await tx.update(webhookEvents).set({ processedAt: new Date(), outcome: result.outcome }).where(eq(webhookEvents.id, eventId));
    return result;
  });
}

// Records the event, processes it, and on failure queues a retry so the HTTP
// answer is 202 and the provider does not need to redeliver.
export async function ingestWebhook(
  db: Db,
  provider: WebhookProvider,
  eventKey: string,
  payload: JobPayload,
): Promise<{ eventId: string; duplicate: boolean; result: ProcessOutcome | null; queued: boolean }> {
  const { id, duplicate } = await recordWebhookEvent(db, provider, eventKey, payload);
  if (duplicate) {
    const [row] = await db.select({ outcome: webhookEvents.outcome }).from(webhookEvents).where(eq(webhookEvents.id, id));
    return { eventId: id, duplicate: true, result: row?.outcome ? { outcome: row.outcome } : null, queued: false };
  }
  try {
    const result = await processWebhookEvent(db, id);
    return { eventId: id, duplicate: false, result, queued: false };
  } catch (err) {
    console.error(`[webhook:${provider}] processing failed; queued for retry`, err);
    await enqueue(db, { kind: "webhook", dedupeKey: `webhook:${id}`, payload: { eventId: id } });
    return { eventId: id, duplicate: false, result: null, queued: true };
  }
}

// Sweep for events that were recorded but never processed and have no retry
// job (e.g. the process died between the insert and the enqueue).
export async function requeueUnprocessedWebhooks(db: Db, olderThanMs = 5 * 60_000): Promise<number> {
  const stale = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(and(isNull(webhookEvents.processedAt), lt(webhookEvents.createdAt, new Date(Date.now() - olderThanMs))))
    .limit(100);
  let queued = 0;
  for (const { id } of stale) {
    if (await enqueue(db, { kind: "webhook", dedupeKey: `webhook:${id}`, payload: { eventId: id } })) queued++;
  }
  return queued;
}

type Tx = Parameters<typeof transition>[0];

async function dispatch(tx: Tx, event: WebhookEvent): Promise<ProcessOutcome> {
  switch (event.provider) {
    case "videoask":
      return processVideoask(tx, event.payload as VideoaskPayload);
    case "identity":
      return processIdentity(tx, event.payload as IdentityPayload);
    case "resend":
      return processResend(tx, event.payload as ResendPayload);
    default:
      return { outcome: `unknown provider ${event.provider}` };
  }
}

// --- VideoAsk -----------------------------------------------------------------

export type VideoaskPayload = { stage: string; applicantId: string; body: unknown };

const STAGE_STATUS = {
  round1: { to: "round1_complete", from: ["submitted"] },
  round2: { to: "docs_submitted", from: ["interview_yes"] },
} as const;

function inferVideoaskStage(status: string): keyof typeof STAGE_STATUS | null {
  if (status === "submitted") return "round1";
  if (status === "interview_yes") return "round2";
  return null;
}

async function processVideoask(tx: Tx, payload: VideoaskPayload): Promise<ProcessOutcome> {
  const current = await lockApplicant(tx, payload.applicantId);
  if (!current) return { outcome: "unknown applicant" };
  const stageKey =
    payload.stage in STAGE_STATUS
      ? (payload.stage as keyof typeof STAGE_STATUS)
      : inferVideoaskStage(current.status);
  const stage = stageKey ? STAGE_STATUS[stageKey] : undefined;
  if (!stage) return { outcome: "unknown stage" };

  const patch = stage.to === "round1_complete" ? { round1CompletedAt: new Date() } : { docsStatus: "submitted" };
  const moved = await transition(tx, {
    applicantId: current.id,
    to: stage.to,
    actor: "videoask",
    reason: `${stageKey} form completed`,
    allowFrom: stage.from,
    patch,
  });
  const reconciled = await reconcileIdentity(tx, current.id);
  const [after] = await tx.select().from(applicants).where(eq(applicants.id, current.id));

  // Round 1 gate: once complete, an identity check has to follow. Queue the
  // provisioning on the completing call and on any retry that finds no link.
  if (stage.to === "round1_complete" && after.status === "round1_complete" && !after.identityLink) {
    await scheduleIdentitySession(tx, current.id);
  }
  return {
    outcome: moved.ok ? "advanced" : `ignored:${moved.code}`,
    advanced: moved.ok || reconciled,
    status: after.status,
  };
}

// --- Identity provider --------------------------------------------------------

export type IdentityPayload = { body: unknown; headers: Record<string, string> };

const IDENTITY_STATUS: Record<IdentityDecision, "verified" | "failed" | "review" | "pending"> = {
  approved: "verified",
  declined: "failed",
  review: "review",
  pending: "pending",
};

async function processIdentity(tx: Tx, payload: IdentityPayload): Promise<ProcessOutcome> {
  const event = getIdentityProvider().parse(payload.body, new Headers(payload.headers));
  if (!event.reference && !event.sessionId) return { outcome: "missing reference" };

  let current = event.reference ? await lockApplicant(tx, event.reference) : undefined;
  if (!current && event.sessionId) {
    const [bySession] = await tx.select({ id: applicants.id }).from(applicants).where(eq(applicants.identitySessionId, event.sessionId));
    if (bySession) current = await lockApplicant(tx, bySession.id);
  }
  if (!current) return { outcome: "unknown applicant" };

  // A result for a session we did not issue (or an old, replaced session) is
  // not this applicant's result. Only the active session may write a decision.
  if (event.sessionId && current.identitySessionId && event.sessionId !== current.identitySessionId) {
    return { outcome: "session mismatch", status: current.status };
  }
  // Providers redeliver out of order. Never let an older event overwrite a newer one.
  if (event.occurredAt && current.identityEventAt && event.occurredAt < current.identityEventAt) {
    return { outcome: "stale", status: current.status };
  }

  await updateApplicant(tx, current.id, {
    identityStatus: IDENTITY_STATUS[event.decision],
    identityCheckedAt: new Date(),
    identityEventAt: event.occurredAt ?? new Date(),
    identitySessionId: current.identitySessionId ?? event.sessionId ?? undefined,
  });
  const advanced = await reconcileIdentity(tx, current.id);
  const [after] = await tx.select({ status: applicants.status }).from(applicants).where(eq(applicants.id, current.id));
  return { outcome: `identity ${IDENTITY_STATUS[event.decision]}`, advanced, status: after.status };
}

// --- Resend delivery events ---------------------------------------------------

export type ResendPayload = { type: string; created_at?: string; data?: { email_id?: string } };

async function processResend(tx: Tx, payload: ResendPayload): Promise<ProcessOutcome> {
  const emailId = payload.data?.email_id;
  if (!emailId || !payload.type?.startsWith("email.")) return { outcome: "ignored" };
  const at = payload.created_at ? new Date(payload.created_at) : new Date();
  const status = payload.type.slice("email.".length);
  const rows = await tx
    .update(jobs)
    .set({ deliveryStatus: status, deliveryEventAt: at })
    .where(and(
      eq(jobs.providerId, emailId),
      or(isNull(jobs.deliveryEventAt), lt(jobs.deliveryEventAt, at)),
    ))
    .returning({ id: jobs.id });
  return { outcome: rows.length ? `delivery ${status}` : "no matching email" };
}

// --- Decision emails ----------------------------------------------------------
// Queued by the review-sheet endpoint on the transition into a status, keyed by
// applicant + status + version so a repeated poll never queues a repeat.

export async function queueDecisionEmail(
  tx: Tx,
  applicant: { id: string; email: string; language: "en" | "fr" },
  status: string,
  version: number,
): Promise<void> {
  let mail = null;
  switch (status) {
    case "rejected":
    case "interview_no":
      mail = decisionEmail(status, null, applicant.language);
      break;
    case "interview_yes": {
      const base = videoAskBase("round2", applicant.language);
      mail = decisionEmail("interview_yes", base ? withApplicantId(base, applicant.id) : null, applicant.language);
      break;
    }
  }
  if (!mail) return;
  await enqueueEmail(tx, `email:decision:${applicant.id}:${status}:${version}`, { to: applicant.email, ...mail }, `decision:${status}`, applicant.id);
}
