"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseLocale } from "@/lib/locale";
import { clearMemberCookie } from "@/lib/ambassador/gate";
import { memberPath } from "@/lib/ambassador/link";
import { staffSameOrigin } from "@/lib/staff/origin";

export async function signOutMember(formData: FormData) {
  const locale = parseLocale(String(formData.get("locale") ?? ""));
  if (staffSameOrigin(await headers())) await clearMemberCookie();
  redirect(memberPath(locale, "/sign-in"));
}
