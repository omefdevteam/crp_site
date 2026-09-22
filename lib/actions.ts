"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import {
  getDb,
  waitlist,
  interest,
  nominations,
} from "@/lib/db";
import { enqueueEmail } from "@/lib/jobs";
import { recordChange } from "@/lib/sync-log";
import { rateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session";
import { createApplication, requestResumeLink } from "@/lib/application";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  waitlistEmail,
  interestEmail,
  nominationEmail,
} from "@/lib/emails";
import {
  waitlistInput,
  interestInput,
  applicationInput,
  nominationInput,
  resumeInput,
  type ApplicationResult,
  type ResumeResult,
} from "@/lib/capture";

async function callerIp(): Promise<string> {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// Reads the Turnstile token from a raw form payload and verifies it with the
// caller's IP. The field schemas ignore extra keys, so the token rides along in
// the same object.
async function passedTurnstile(raw: unknown): Promise<boolean> {
  const token =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>).turnstileToken
      : undefined;
  return verifyTurnstile(typeof token === "string" ? token : undefined, await callerIp());
}

// Per-IP and per-address ceilings. Generous for a person, tight for a script.
async function withinLimits(scope: string, email: string, perIp: number, perEmail: number): Promise<boolean> {
  const ip = await callerIp();
  const [ipOk, emailOk] = await Promise.all([
    rateLimit(`${scope}:ip`, ip, perIp),
    rateLimit(`${scope}:email`, email, perEmail),
  ]);
  return ipOk && emailOk;
}

export async function submitWaitlist(raw: unknown): Promise<{ ok: boolean }> {
  if (!(await passedTurnstile(raw))) return { ok: false };
  const parsed = waitlistInput.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const { email, name, source } = parsed.data;
  if (!(await withinLimits("waitlist", email, 20, 3))) return { ok: false };

  await getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(waitlist)
      .values({ email, name, source })
      .onConflictDoUpdate({
        target: waitlist.email,
        set: { status: "subscribed", updatedAt: new Date() },
      })
      .returning();
    await recordChange(tx, "waitlist", row.id, "update", row);
    await enqueueEmail(tx, `email:waitlist:${row.id}`, { to: email, ...waitlistEmail() }, "waitlist");
  });
  return { ok: true };
}

export async function submitInterest(
  raw: unknown,
): Promise<{ ok: boolean; already?: boolean }> {
  if (!(await passedTurnstile(raw))) return { ok: false };
  const parsed = interestInput.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const { email, name, ageGroup, track, source } = parsed.data;
  if (!(await withinLimits("interest", email, 20, 3))) return { ok: false };

  const already = await getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: interest.id })
      .from(interest)
      .where(eq(interest.email, email));
    const [row] = await tx
      .insert(interest)
      .values({ email, name, ageGroup, track, source })
      .onConflictDoUpdate({
        target: interest.email,
        set: { ageGroup, track, updatedAt: new Date() },
      })
      .returning();
    await recordChange(tx, "interest", row.id, existing ? "update" : "insert", row);
    // Only email on the first expression of interest; the dedupe key makes a
    // retried first submission a no-op too.
    if (!existing) await enqueueEmail(tx, `email:interest:${row.id}`, { to: email, ...interestEmail() }, "interest");
    return Boolean(existing);
  });
  return { ok: true, already };
}

export async function submitNomination(raw: unknown): Promise<{ ok: boolean }> {
  if (!(await passedTurnstile(raw))) return { ok: false };
  const parsed = nominationInput.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const {
    nominatorName,
    nominatorEmail,
    nominatorPhone,
    nominatorOrganization,
    nominatorRelation,
    nomineeName,
    nomineeEmail,
    nomineeDob,
    nomineePhone,
    nomineeNationality,
    nomineeBasedIn,
    nomineeLocation,
    track,
  } = parsed.data;
  if (!(await withinLimits("nomination", nominatorEmail, 20, 10))) return { ok: false };

  const basedIn = nomineeBasedIn ?? nomineeLocation;

  await getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(nominations)
      .values({
        nominatorName,
        nominatorEmail,
        nominatorPhone,
        nominatorOrganization,
        nominatorRelation,
        nomineeName,
        nomineeEmail,
        nomineeDob,
        nomineePhone,
        nomineeNationality,
        nomineeBasedIn: basedIn,
        nomineeLocation: basedIn,
        track,
      })
      .onConflictDoNothing({
        target: [nominations.nominatorEmail, nominations.nomineeEmail],
      })
      .returning();
    // A repeated nomination of the same person is acknowledged, not re-mailed.
    if (!row) return;
    await recordChange(tx, "nominations", row.id, "insert", row);
    await enqueueEmail(tx, `email:nomination:${row.id}`, { to: nominatorEmail, ...nominationEmail(nomineeName) }, "nomination");
  });
  return { ok: true };
}

export async function startApplication(raw: unknown): Promise<ApplicationResult> {
  if (!(await passedTurnstile(raw))) return { ok: false, reason: "turnstile" };
  const parsed = applicationInput.safeParse(raw);
  if (!parsed.success) {
    console.warn("[apply] invalid input", parsed.error.flatten());
    return { ok: false, reason: "invalid" };
  }
  if (!(await withinLimits("apply", parsed.data.email, 10, 5))) return { ok: false, reason: "rate_limited" };

  const result = await createApplication(getDb(), parsed.data);
  if (!result.ok) return result;

  await setSessionCookie(result.id);
  return { ok: true, id: result.id, round1Url: result.round1Link, isNew: true };
}

// Emails a single-use link to whoever owns the address. The answer is the same
// whether or not that address has applied.
export async function requestApplicationLink(raw: unknown): Promise<ResumeResult> {
  if (!(await passedTurnstile(raw))) return { ok: false, reason: "turnstile" };
  const parsed = resumeInput.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  if (!(await withinLimits("resume", parsed.data.email, 10, 3))) return { ok: false, reason: "rate_limited" };

  await requestResumeLink(getDb(), parsed.data.email);
  return { ok: true };
}
