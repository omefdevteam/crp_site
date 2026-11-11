"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { parseLocale } from "@/lib/locale";
import { assertMemberAction } from "@/lib/ambassador/gate";
import { memberPath } from "@/lib/ambassador/link";
import { storyPhotoStoreFromEnv } from "@/lib/ambassador/photo-store";
import { parseDraft, type DraftProblem, type MissingPart } from "@/lib/ambassador/story-model";
import { deleteStory, saveStory, submitStory, withdrawStory, type StoryFailure } from "@/lib/ambassador/stories";

export type StoryFormState = {
  readonly problem: DraftProblem | StoryFailure["reason"] | "signed_out";
  readonly missing?: readonly MissingPart[];
} | null;

function version(formData: FormData): number | null {
  const raw = String(formData.get("version") ?? "");
  return /^\d{1,9}$/.test(raw) ? Number(raw) : null;
}

// One action for the story form. "save" keeps a draft; "submit" saves, then
// sends the story to the team for review.
export async function saveStoryAction(_previous: StoryFormState, formData: FormData): Promise<StoryFormState> {
  const locale = parseLocale(String(formData.get("locale") ?? ""));
  const member = await assertMemberAction();
  if (!member) return { problem: "signed_out" };
  const parsed = parseDraft({
    kind: formData.get("kind"),
    title: formData.get("title"),
    body: formData.get("body"),
    language: formData.get("language"),
    placeId: formData.get("placeId"),
  });
  if (!parsed.ok) return { problem: parsed.problem };
  const rawId = String(formData.get("storyId") ?? "");
  const db = getDb();
  const saved = await saveStory(db, member, rawId || null, parsed.draft, rawId ? version(formData) : null);
  if (!saved.ok) return saved.reason === "incomplete" ? { problem: saved.reason, missing: saved.missing } : { problem: saved.reason };
  if (formData.get("intent") === "submit") {
    const sent = await submitStory(db, member, saved.id, null);
    if (!sent.ok) {
      // The draft is saved; land on its page with the reason it was not sent.
      const missing = sent.reason === "incomplete" ? `&missing=${sent.missing.join(",")}` : "";
      redirect(memberPath(locale, `/stories/${saved.id}?notice=${sent.reason}${missing}`));
    }
    redirect(memberPath(locale, `/stories/${saved.id}?notice=submitted`));
  }
  redirect(memberPath(locale, `/stories/${saved.id}?notice=saved`));
}

export async function withdrawStoryAction(formData: FormData) {
  const locale = parseLocale(String(formData.get("locale") ?? ""));
  const id = String(formData.get("storyId") ?? "");
  const member = await assertMemberAction();
  if (!member) redirect(memberPath(locale, "/sign-in"));
  const result = await withdrawStory(getDb(), member, id);
  redirect(memberPath(locale, `/stories/${id}?notice=${result.ok ? "withdrawn" : result.reason}`));
}

export async function deleteStoryAction(formData: FormData) {
  const locale = parseLocale(String(formData.get("locale") ?? ""));
  const id = String(formData.get("storyId") ?? "");
  const member = await assertMemberAction();
  if (!member) redirect(memberPath(locale, "/sign-in"));
  const result = await deleteStory(getDb(), member, id, storyPhotoStoreFromEnv());
  if (!result.ok) redirect(memberPath(locale, `/stories/${id}?notice=${result.reason}`));
  redirect(memberPath(locale, "?notice=deleted"));
}
