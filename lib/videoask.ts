import { createHmac, timingSafeEqual } from "crypto";
import { appSecret } from "@/lib/config";
import { videoAskBase } from "@/lib/capture";
import type { ApplicationLocale } from "@/lib/locale";

export type VideoaskStage = "round1" | "round2";
function signature(value: string) {
  return createHmac("sha256", appSecret()).update(`videoask:${value}`).digest("base64url");
}
export function videoaskReference(applicantId: string, stage: VideoaskStage, language: ApplicationLocale): string {
  const value = `${applicantId}.${stage}.${language}`;
  return `${value}.${signature(value)}`;
}
export function parseVideoaskReference(raw: unknown): { applicantId: string; stage: VideoaskStage; language: ApplicationLocale } | null {
  if (typeof raw !== "string" || raw.length > 200) return null;
  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [applicantId, stage, language, mac] = parts;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicantId) || !["round1", "round2"].includes(stage) || !["en", "fr", "es"].includes(language)) return null;
  const expected = Buffer.from(signature(parts.slice(0, 3).join(".")));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { applicantId, stage: stage as VideoaskStage, language: language as ApplicationLocale };
}
export function videoaskLink(applicantId: string, stage: VideoaskStage, language: ApplicationLocale): string | null {
  const base = videoAskBase(stage, language);
  if (!base) return null;
  const url = new URL(base);
  const variables = new URLSearchParams(url.hash.slice(1));
  variables.set("application_ref", videoaskReference(applicantId, stage, language));
  url.hash = variables.toString();
  return url.toString();
}
// Inspect only provider metadata, never answer text or arbitrary nested values.
export function readVideoaskCompletion(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!["form_response", "form_response_transcribed"].includes(String(b.event_type)) || typeof b.event_id !== "string") return null;
  const contact = b.contact as Record<string, unknown> | undefined;
  const form = b.form as Record<string, unknown> | undefined;
  if (!contact || contact.status !== "completed" || !form) return null;
  const variables = contact.variables as Record<string, unknown> | { key?: string; name?: string; value?: unknown }[] | undefined;
  const raw = Array.isArray(variables)
    ? variables.find((v) => v && typeof v === "object" && (v.key ?? v.name) === "application_ref")?.value
    : variables?.application_ref;
  const reference = parseVideoaskReference(raw);
  if (!reference) return null;
  const expectedForm = process.env[`VIDEOASK_${reference.stage.toUpperCase()}_FORM_ID_${reference.language.toUpperCase()}`];
  if (!expectedForm || form.form_id !== expectedForm) return null;
  return { ...reference, eventId: b.event_id, formId: expectedForm };
}
