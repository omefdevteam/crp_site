import { createHmac, timingSafeEqual } from "crypto";
import { appSecret } from "@/lib/config";
export const SESSION_COOKIE = "crp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;
function sign(payload: string): string {
  return createHmac("sha256", appSecret()).update(`session:${payload}`).digest("base64url");
}
export function signSession(applicantId: string, version: number, ttlSeconds = SESSION_TTL_SECONDS, now = Date.now()): string {
  const payload = `${applicantId}.${version}.${Math.floor(now / 1000) + ttlSeconds}`;
  return `${payload}.${sign(payload)}`;
}
export function verifySession(value: string | undefined | null, now = Date.now()): { applicantId: string; version: number } | null {
  if (!value || value.length > 200) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null; // Reject every legacy, pre-verification cookie.
  const [applicantId, version, exp, signature] = parts;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicantId)) return null;
  if (!/^\d+$/.test(version) || !/^\d+$/.test(exp) || !Number.isSafeInteger(Number(version)) || !Number.isSafeInteger(Number(exp)) || Number(exp) * 1000 <= now) return null;
  const expected = Buffer.from(sign(parts.slice(0, 3).join(".")));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { applicantId, version: Number(version) };
}
export function sessionCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL_SECONDS };
}
