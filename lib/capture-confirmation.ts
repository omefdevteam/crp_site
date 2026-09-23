import { randomBytes, randomUUID } from "crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { captureTokens, jobs, waitlist, interest, type Db, type Store } from "@/lib/db";
import { hashToken, RESUME_TOKEN_TTL_SECONDS } from "@/lib/access";
import { appUrl } from "@/lib/config";
import { captureConfirmationEmail, waitlistEmail, interestEmail } from "@/lib/emails";
import { waitlistInput, interestInput, type WaitlistInput, type InterestInput } from "@/lib/capture";
import { enqueue, enqueueEmail, type Job, type EmailJobPayload } from "@/lib/jobs";
import { recordChange } from "@/lib/sync-log";

export async function requestCaptureConfirmation(db: Db, kind: "waitlist" | "interest", input: WaitlistInput | InterestInput) {
  await enqueue(db, { kind: "email", dedupeKey: `email:capture:${randomUUID()}`, payload: { template: "capture_confirmation", to: input.email, kind, input } });
}
export async function prepareCaptureEmail(db: Db, job: Job): Promise<EmailJobPayload | null> {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(jobs).where(and(eq(jobs.id, job.id), eq(jobs.lockToken, job.lockToken!))).for("update");
    if (!current) return null;
    let payload = current.payload;
    let tokenHash = typeof payload.tokenHash === "string" ? payload.tokenHash : "";
    if (!payload.html) {
      const raw = randomBytes(32).toString("base64url");
      tokenHash = hashToken(raw);
      await tx.insert(captureTokens).values({ hash: tokenHash, kind: String(payload.kind), payload: payload.input as Record<string, unknown>, expiresAt: new Date(Date.now() + RESUME_TOKEN_TTL_SECONDS * 1000) });
      const link = `${appUrl()}/api/capture/confirm?token=${raw}`;
      payload = { ...payload, ...captureConfirmationEmail(link, payload.kind === "waitlist" ? "waitlist" : "interest"), tokenHash };
      await tx.update(jobs).set({ payload }).where(eq(jobs.id, current.id));
    }
    const renewed = await tx.update(captureTokens).set({ expiresAt: new Date(Date.now() + RESUME_TOKEN_TTL_SECONDS * 1000) })
      .where(and(eq(captureTokens.hash, tokenHash), isNull(captureTokens.usedAt))).returning({ hash: captureTokens.hash });
    return renewed.length ? payload as EmailJobPayload : null;
  });
}
export async function confirmCapture(db: Db, raw: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(raw)) return false;
  return db.transaction(async (tx) => {
    const [token] = await tx.update(captureTokens).set({ usedAt: new Date() })
      .where(and(eq(captureTokens.hash, hashToken(raw)), isNull(captureTokens.usedAt), gt(captureTokens.expiresAt, new Date())))
      .returning();
    if (!token) return false;
    if (token.kind === "waitlist") {
      const input = waitlistInput.parse(token.payload);
      const [row] = await tx.insert(waitlist).values(input).onConflictDoUpdate({ target: waitlist.email, set: { status: "subscribed", updatedAt: new Date() } }).returning();
      await recordChange(tx, "waitlist", row.id, "update", row);
      await enqueueEmail(tx, `email:waitlist:${row.id}`, { to: row.email, ...waitlistEmail() }, "waitlist");
    } else if (token.kind === "interest") {
      const input = interestInput.parse(token.payload);
      const [row] = await tx.insert(interest).values(input).onConflictDoUpdate({ target: interest.email, set: { ageGroup: input.ageGroup, track: input.track, updatedAt: new Date() } }).returning();
      await recordChange(tx, "interest", row.id, "update", row);
      await enqueueEmail(tx, `email:interest:${row.id}`, { to: row.email, ...interestEmail() }, "interest");
    } else throw new Error("unknown capture kind");
    return true;
  });
}
export async function purgeCaptureTokens(db: Store) {
  await db.delete(captureTokens).where(lt(captureTokens.expiresAt, new Date(Date.now() - 24 * 3600_000)));
}
