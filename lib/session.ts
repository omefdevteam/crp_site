import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { appSecret } from "@/lib/config";

// An applicant's browser session. Replaces the old raw-id cookie: the value is
// signed, so knowing (or guessing) an applicant id no longer grants access to
// that applicant's identity check or recovery flow.
export const SESSION_COOKIE = "crp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sign(payload: string): string {
  return createHmac("sha256", appSecret()).update(payload).digest("base64url");
}

export function signSession(applicantId: string, ttlSeconds = SESSION_TTL_SECONDS, now = Date.now()): string {
  const payload = `${applicantId}.${Math.floor(now / 1000) + ttlSeconds}`;
  return `${payload}.${sign(payload)}`;
}

// The applicant id if the cookie is intact and unexpired, otherwise null.
export function verifySession(value: string | undefined | null, now = Date.now()): string | null {
  if (!value) return null;
  const [applicantId, exp, signature] = value.split(".");
  if (!applicantId || !exp || !signature || !UUID_RE.test(applicantId)) return null;
  if (Number(exp) * 1000 < now) return null;
  const expected = Buffer.from(sign(`${applicantId}.${exp}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return applicantId;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const, // sent on the top-level redirect back from VideoAsk
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function setSessionCookie(applicantId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, signSession(applicantId), sessionCookieOptions());
}
