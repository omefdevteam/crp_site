import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { Locale } from "@/lib/locale";
import { MEMBER_COOKIE, memberCookieOptions, readMember, revokeMemberSession, type Member } from "@/lib/ambassador/auth";
import { memberPath } from "@/lib/ambassador/link";
import { staffSameOrigin } from "@/lib/staff/origin";

export async function currentMember(): Promise<Member | null> {
  const jar = await cookies();
  return readMember(getDb(), jar.get(MEMBER_COOKIE)?.value);
}

export async function requireMember(locale: Locale): Promise<Member> {
  const member = await currentMember();
  if (!member) redirect(memberPath(locale, "/sign-in"));
  return member;
}

// Ambassador mutations use the same strict same-origin test as staff ones.
export async function assertMemberAction(): Promise<Member | null> {
  if (!staffSameOrigin(await headers())) return null;
  return currentMember();
}

export async function setMemberCookie(raw: string): Promise<void> {
  const jar = await cookies();
  jar.set(MEMBER_COOKIE, raw, memberCookieOptions(process.env.NODE_ENV === "production"));
}

export async function clearMemberCookie(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(MEMBER_COOKIE)?.value;
  if (raw) await revokeMemberSession(getDb(), raw);
  jar.delete({ name: MEMBER_COOKIE, path: "/" });
}
