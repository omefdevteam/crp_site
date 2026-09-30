import { createHmac, timingSafeEqual } from "crypto";
import { appSecret } from "@/lib/config";
import type { ApplicationLocale } from "@/lib/locale";

function sign(value: string): string {
  return createHmac("sha256", appSecret()).update(`calendly:${value}`).digest("base64url");
}

export function calendlyReference(applicantId: string): string {
  return `${applicantId}.${sign(applicantId)}`;
}

export function parseCalendlyReference(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 200) return null;
  const [applicantId, mac, ...rest] = raw.split(".");
  if (rest.length || !applicantId || !mac || !/^[0-9a-f-]{36}$/i.test(applicantId)) return null;
  const expected = Buffer.from(sign(applicantId));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given) ? applicantId : null;
}

export function calendlyLink(
  applicant: { id: string; fullName: string; email: string; language: ApplicationLocale },
): string | null {
  const base = process.env[`CALENDLY_URL_${applicant.language.toUpperCase()}`];
  if (!base) return null;
  const url = new URL(base);
  url.searchParams.set("name", applicant.fullName);
  url.searchParams.set("email", applicant.email);
  url.searchParams.set("utm_content", calendlyReference(applicant.id));
  return url.toString();
}
