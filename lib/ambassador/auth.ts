import { randomBytes } from "crypto";
import { and, eq, gt, inArray, isNull, lt } from "drizzle-orm";
import { hashToken } from "@/lib/access";
import {
  ambassadorSessions,
  ambassadorSignInTokens,
  ambassadors,
  applicants,
  type Store,
} from "@/lib/db";
import { parseEmail } from "@/lib/staff/users";
import { AMBASSADOR_STATUSES } from "@/lib/ambassador/status";

// Ambassador sign-in mirrors staff sign-in (lib/staff/auth.ts) on separate
// tables and a separate cookie. A staff link cannot be spent here and an
// Ambassador session is never read by the staff gate.
export const MEMBER_COOKIE = "crp_member";
export const MEMBER_SIGN_IN_TTL_MS = 15 * 60 * 1000;
export const MEMBER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type Member = {
  id: string;
  applicantId: string;
  email: string;
  displayName: string;
  language: string;
};

export function memberCookieOptions(secure: boolean) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: MEMBER_SESSION_TTL_MS / 1000,
  };
}

// The one test for "can this account sign in right now". Every read joins the
// applicant, so a status change takes effect on the next request.
const active = and(isNull(ambassadors.disabledAt), inArray(applicants.status, [...AMBASSADOR_STATUSES]));

async function findActiveByEmail(db: Store, email: string): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: ambassadors.id })
    .from(ambassadors)
    .innerJoin(applicants, eq(applicants.id, ambassadors.applicantId))
    .where(and(eq(ambassadors.email, email), active));
  return row ?? null;
}

// Returns null for an unknown, disabled, or no-longer-eligible address. The
// caller shows the same message either way, so the form does not reveal who
// is an Ambassador.
export async function issueMemberLink(db: Store, rawEmail: string): Promise<{ raw: string; hash: string; ambassadorId: string } | null> {
  const email = parseEmail(rawEmail);
  if (!email) return null;
  const member = await findActiveByEmail(db, email);
  if (!member) return null;
  const raw = randomBytes(32).toString("base64url");
  const hash = hashToken(raw);
  await db.insert(ambassadorSignInTokens).values({
    hash,
    ambassadorId: member.id,
    expiresAt: new Date(Date.now() + MEMBER_SIGN_IN_TTL_MS),
  });
  return { raw, hash, ambassadorId: member.id };
}

// Spends the link with one conditional update, so a second submit gets
// nothing. Eligibility is checked again here: a link sent before a status
// change must not open the account after it.
export async function redeemMemberLink(db: Store, raw: string): Promise<{ session: string; ambassadorId: string } | null> {
  if (!raw || raw.length > 200) return null;
  const [spent] = await db
    .update(ambassadorSignInTokens)
    .set({ usedAt: new Date() })
    .where(and(
      eq(ambassadorSignInTokens.hash, hashToken(raw)),
      isNull(ambassadorSignInTokens.usedAt),
      gt(ambassadorSignInTokens.expiresAt, new Date()),
    ))
    .returning({ ambassadorId: ambassadorSignInTokens.ambassadorId });
  if (!spent) return null;
  const [member] = await db
    .select({ id: ambassadors.id })
    .from(ambassadors)
    .innerJoin(applicants, eq(applicants.id, ambassadors.applicantId))
    .where(and(eq(ambassadors.id, spent.ambassadorId), active));
  if (!member) return null;
  const session = randomBytes(32).toString("base64url");
  await db.insert(ambassadorSessions).values({
    hash: hashToken(session),
    ambassadorId: member.id,
    expiresAt: new Date(Date.now() + MEMBER_SESSION_TTL_MS),
  });
  await db.update(ambassadors).set({ lastSignInAt: new Date() }).where(eq(ambassadors.id, member.id));
  return { session, ambassadorId: member.id };
}

export async function readMember(db: Store, raw: string | undefined | null): Promise<Member | null> {
  if (!raw || raw.length > 200) return null;
  const [row] = await db
    .select({
      id: ambassadors.id,
      applicantId: ambassadors.applicantId,
      email: ambassadors.email,
      displayName: ambassadors.displayName,
      language: ambassadors.language,
    })
    .from(ambassadorSessions)
    .innerJoin(ambassadors, eq(ambassadors.id, ambassadorSessions.ambassadorId))
    .innerJoin(applicants, eq(applicants.id, ambassadors.applicantId))
    .where(and(eq(ambassadorSessions.hash, hashToken(raw)), gt(ambassadorSessions.expiresAt, new Date()), active));
  return row ?? null;
}

export async function revokeMemberSession(db: Store, raw: string | undefined | null): Promise<void> {
  if (!raw) return;
  await db.delete(ambassadorSessions).where(eq(ambassadorSessions.hash, hashToken(raw)));
}

export async function purgeExpiredMemberSignIns(db: Store): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.delete(ambassadorSignInTokens).where(lt(ambassadorSignInTokens.expiresAt, cutoff));
  await db.delete(ambassadorSessions).where(lt(ambassadorSessions.expiresAt, cutoff));
}
