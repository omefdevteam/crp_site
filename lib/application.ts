import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import {
  applicants,
  consentLog,
  type Applicant,
  type Db,
} from "@/lib/db";
import { appUrl } from "@/lib/config";
import { issueAccessToken, RESUME_TOKEN_TTL_SECONDS } from "@/lib/access";
import {
  ageFromDob,
  minApplicantAge,
  maxApplicantAge,
  withApplicantId,
  videoAskBase,
  CONSENT_VERSION,
  type ApplicationInput,
} from "@/lib/capture";
import { applicationEmail, identityEmail, resumeEmail } from "@/lib/emails";
import { getIdentityProvider } from "@/lib/identity";
import { enqueue, enqueueEmail } from "@/lib/jobs";
import { reconcileIdentity } from "@/lib/application-status";
import { recordCreation, transition, updateApplicant } from "@/lib/lifecycle";

// The applicant journey as database operations. Each function is one unit of
// work: everything that must be true together is written in one transaction,
// and every email is queued in that same transaction rather than sent inline.

export type CreateApplicationResult =
  | { ok: true; id: string; round1Link: string | null }
  | { ok: false; reason: "ineligible" | "existing" };

export async function createApplication(db: Db, input: ApplicationInput): Promise<CreateApplicationResult> {
  const { fullName, email, dob, language, track, phone, nationality, basedIn, skills, canTravel, hasValidPassport } = input;

  // Silent server-side backstop for the 19-26 window; the form gates too.
  const age = ageFromDob(dob);
  if (age < minApplicantAge() || age > maxApplicantAge()) return { ok: false, reason: "ineligible" };

  const id = randomUUID();
  const base = videoAskBase("round1", language);
  const round1Link = base ? withApplicantId(base, id) : null;

  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(applicants)
      .values({
        id,
        fullName,
        email,
        dob,
        age,
        language,
        track,
        phone,
        nationality,
        basedIn,
        skills,
        canTravel: track === "in_person" ? Boolean(canTravel) : null,
        hasValidPassport: track === "in_person" ? Boolean(hasValidPassport) : null,
        round1Link,
      })
      .onConflictDoNothing({ target: applicants.email })
      .returning();
    // Knowing an email address is not proof of ownership. Existing applicants
    // get a resume link sent to that address instead (see requestResumeLink).
    if (!inserted) return { ok: false, reason: "existing" } as const;

    await tx.insert(consentLog).values({ applicantId: id, kind: "data_processing", version: CONSENT_VERSION });
    await recordCreation(tx, inserted, "applicant", "application submitted");
    await enqueueEmail(tx, `email:application:${id}`, { to: email, ...applicationEmail(fullName, round1Link, language) }, "application", id);
    return { ok: true, id, round1Link } as const;
  });
}

// Sends a single-use sign-in link to an existing applicant. Returns the same
// shape whether or not the address is known, so the form cannot be used to
// probe which emails have applied.
export async function requestResumeLink(db: Db, email: string): Promise<{ queued: boolean }> {
  return db.transaction(async (tx) => {
    const [applicant] = await tx.select().from(applicants).where(eq(applicants.email, email));
    if (!applicant) return { queued: false };
    const token = await issueAccessToken(tx, applicant.id, "resume", RESUME_TOKEN_TTL_SECONDS);
    const link = `${appUrl()}/api/apply/resume?token=${encodeURIComponent(token.raw)}`;
    // Dedupe on the token hash: each request is its own email, but a retried
    // request for the same token is not.
    await enqueueEmail(tx, `email:resume:${token.hash}`, { to: applicant.email, ...resumeEmail(applicant.fullName, link, applicant.language) }, "resume", applicant.id);
    return { queued: true };
  });
}

// VideoAsk's completion redirect lands on /api/apply/verify. That browser hit
// is the Round 1 completion signal when the VideoAsk webhook is missing or
// delayed; a later webhook for the same stage is a no-op.
export async function completeRound1FromRedirect(db: Db, applicantId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await transition(tx, {
      applicantId,
      to: "round1_complete",
      actor: "applicant",
      reason: "round 1 form completed",
      allowFrom: ["submitted"],
      patch: { round1CompletedAt: new Date() },
    });
    await reconcileIdentity(tx, applicantId);
  });
}

// Where an applicant should be sent when they come back with a valid session.
export function nextStepUrl(applicant: Applicant): string {
  const site = appUrl();
  switch (applicant.status) {
    case "submitted":
      return applicant.round1Link ?? `${site}/apply/complete`;
    case "round1_complete":
    case "id_failed":
      return applicant.identityLink ?? `${site}/api/apply/verify`;
    case "interview_yes": {
      const base = videoAskBase("round2", applicant.language);
      return base ? withApplicantId(base, applicant.id) : `${site}/apply/complete`;
    }
    default:
      return `${site}/apply/complete`;
  }
}

// Creates (or reuses) the hosted identity session, stores it, and queues the
// email carrying the link. Idempotent: an existing link is returned as is, so
// a refresh, a double webhook, or a worker retry never opens a second session.
export async function provisionIdentitySession(db: Db, applicantId: string): Promise<{ url: string | null; created: boolean }> {
  const [existing] = await db.select().from(applicants).where(eq(applicants.id, applicantId));
  if (!existing) return { url: null, created: false };
  if (existing.identityLink) return { url: existing.identityLink, created: false };

  const callback = `${appUrl()}/apply/complete`;
  const session = await getIdentityProvider().createSession(existing.id, callback);
  if (!session) return { url: null, created: false };

  return db.transaction(async (tx) => {
    const [fresh] = await tx.select().from(applicants).where(eq(applicants.id, applicantId)).for("update");
    if (fresh?.identityLink) return { url: fresh.identityLink, created: false };
    const updated = await updateApplicant(tx, applicantId, {
      identitySessionId: session.sessionId,
      identityLink: session.url,
      identityStatus: fresh?.identityStatus ?? "pending",
    });
    if (!updated) return { url: null, created: false };
    await enqueueEmail(tx, `email:identity:${applicantId}`, { to: updated.email, ...identityEmail(updated.fullName, session.url, updated.language) }, "identity", applicantId);
    return { url: session.url, created: true };
  });
}

// Queues provisioning for the worker; used from webhook processing so a
// provider outage there is retried rather than logged and forgotten.
export async function scheduleIdentitySession(tx: Parameters<typeof enqueue>[0], applicantId: string): Promise<void> {
  await enqueue(tx, { kind: "identity_session", dedupeKey: `identity_session:${applicantId}`, payload: { applicantId }, applicantId });
}
