"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { parseLocale } from "@/lib/locale";
import { redeemMemberLink } from "@/lib/ambassador/auth";
import { setMemberCookie } from "@/lib/ambassador/gate";
import { memberPath } from "@/lib/ambassador/link";
import { staffSameOrigin } from "@/lib/staff/origin";

export async function completeMemberSignIn(formData: FormData) {
  const locale = parseLocale(String(formData.get("locale") ?? ""));
  if (!staffSameOrigin(await headers())) redirect(memberPath(locale, "/sign-in?error=link"));
  const session = await redeemMemberLink(getDb(), String(formData.get("token") ?? ""));
  if (!session) redirect(memberPath(locale, "/sign-in?error=link"));
  await setMemberCookie(session.session);
  redirect(memberPath(locale));
}
