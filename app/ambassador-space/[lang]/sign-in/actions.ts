"use server";

import { headers } from "next/headers";
import { appUrl } from "@/lib/config";
import { getDb } from "@/lib/db";
import { deliverEmail } from "@/lib/email";
import { ambassadorSignInEmail } from "@/lib/emails";
import { parseLocale } from "@/lib/locale";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { issueMemberLink } from "@/lib/ambassador/auth";
import { memberSignInLink } from "@/lib/ambassador/link";
import { staffSameOrigin } from "@/lib/staff/origin";
import { parseEmail } from "@/lib/staff/users";

export type MemberLinkState = { status: "sent" | "invalid"; devLink?: string } | null;

// The answer is the same whether or not the address belongs to an Ambassador,
// so the form never reveals who is one.
export async function requestMemberLink(_previous: MemberLinkState, formData: FormData): Promise<MemberLinkState> {
  const headerList = await headers();
  if (!staffSameOrigin(headerList)) return { status: "sent" };
  const locale = parseLocale(String(formData.get("locale") ?? ""));
  const email = parseEmail(String(formData.get("email") ?? ""));
  if (!email) return { status: "invalid" };
  const allowed = (await rateLimit("member-signin:ip", clientIp(headerList), 20, 3600))
    && (await rateLimit("member-signin:email", email, 5, 3600));
  if (!allowed) return { status: "sent" };
  const issued = await issueMemberLink(getDb(), email);
  if (!issued) return { status: "sent" };
  const link = memberSignInLink(appUrl(), locale, issued.raw);
  const mail = ambassadorSignInEmail(locale, link);
  const sent = await deliverEmail({ to: email, subject: mail.subject, html: mail.html }, issued.hash);
  if (sent.ok && sent.skipped && process.env.NODE_ENV !== "production") return { status: "sent", devLink: link };
  return { status: "sent" };
}
