"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { expireGlobe } from "@/lib/ambassador/globe";
import { isReviewVerb, reviewStory, type ReviewFailure } from "@/lib/ambassador/review";
import { assertStaffAction } from "@/lib/staff/gate";

export type ReviewFormState = { readonly result: ReviewFailure | "forbidden" | "invalid" | "saved"; readonly verb?: string } | null;

export async function reviewStoryAction(_previous: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const staff = await assertStaffAction("stories.review");
  if (!staff) return { result: "forbidden" };
  const storyId = String(formData.get("storyId") ?? "");
  const verb = String(formData.get("verb") ?? "");
  const rawVersion = String(formData.get("version") ?? "");
  if (!isReviewVerb(verb) || !/^\d{1,9}$/.test(rawVersion)) return { result: "invalid" };
  const rawPlace = String(formData.get("placeId") ?? "");
  const result = await reviewStory(getDb(), staff, {
    storyId,
    verb,
    expectedVersion: Number(rawVersion),
    reason: String(formData.get("reason") ?? ""),
    placeId: /^\d{1,7}$/.test(rawPlace) ? Number(rawPlace) : null,
  });
  if (!result.ok) return { result: result.reason, verb };
  // Approve and take down change the globe; a moved pin does when it is live.
  if (verb !== "move" || result.status === "approved") expireGlobe();
  revalidatePath(`/admin/stories/${storyId}`);
  revalidatePath("/admin/stories");
  return { result: "saved", verb };
}
