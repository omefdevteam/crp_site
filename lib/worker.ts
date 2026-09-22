import { getDb } from "@/lib/db";
import { deliverEmail } from "@/lib/email";
import { provisionIdentitySession } from "@/lib/application";
import { purgeExpiredTokens } from "@/lib/access";
import { purgeExpiredRateLimits } from "@/lib/rate-limit";
import {
  runDueJobs,
  type EmailJobPayload,
  type IdentitySessionJobPayload,
  type JobHandler,
  type JobKind,
  type WebhookJobPayload,
} from "@/lib/jobs";
import { processWebhookEvent, requeueUnprocessedWebhooks } from "@/lib/webhooks";

// One handler per job kind. Handlers must be idempotent: the worker may run a
// job again after a crash or an expired lock, and dedupe keys only stop the same
// job being queued twice, not being attempted twice.
export const handlers: Record<JobKind, JobHandler> = {
  async email(job) {
    const { to, subject, html } = job.payload as EmailJobPayload;
    const result = await deliverEmail({ to, subject, html }, job.dedupeKey);
    if (result.ok) return { status: "done", providerId: result.id, deliveryStatus: result.skipped ? "skipped" : "accepted" };
    return { status: result.retryable ? "retry" : "failed", error: result.error };
  },

  async identity_session(job, db) {
    const { applicantId } = job.payload as IdentitySessionJobPayload;
    const result = await provisionIdentitySession(db, applicantId);
    if (result.url) return { status: "done", providerId: null, deliveryStatus: result.created ? "created" : "existing" };
    return { status: "retry", error: "identity provider did not return a session" };
  },

  async webhook(job, db) {
    const { eventId } = job.payload as WebhookJobPayload;
    const result = await processWebhookEvent(db, eventId);
    return { status: "done", deliveryStatus: result.outcome };
  },
};

// One cron tick: retry anything due, sweep for orphaned webhook events, and
// drop expired housekeeping rows.
export async function tick(limit = 25) {
  const db = getDb();
  const requeued = await requeueUnprocessedWebhooks(db);
  const jobs = await runDueJobs(handlers, limit, db);
  await purgeExpiredTokens(db);
  await purgeExpiredRateLimits(db);
  return { ...jobs, requeuedWebhooks: requeued };
}
