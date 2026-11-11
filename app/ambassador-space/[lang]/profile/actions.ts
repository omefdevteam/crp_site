"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { parseLocale } from "@/lib/locale";
import { assertMemberAction } from "@/lib/ambassador/gate";
import { expireGlobe } from "@/lib/ambassador/globe";
import { memberPath } from "@/lib/ambassador/link";
import { updateProfile } from "@/lib/ambassador/profile";
import { parseProfile, type ProfileProblem } from "@/lib/ambassador/story-model";

export type ProfileFormState = { readonly problem: ProfileProblem | "not_found" | "signed_out" } | null;

export async function saveProfileAction(_previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const locale = parseLocale(String(formData.get("locale") ?? ""));
  const member = await assertMemberAction();
  if (!member) return { problem: "signed_out" };
  const parsed = parseProfile({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    homePlaceId: formData.get("homePlaceId"),
    showOnGlobe: formData.get("showOnGlobe"),
    language: formData.get("language"),
  });
  if (!parsed.ok) return { problem: parsed.problem };
  const result = await updateProfile(getDb(), member.id, parsed.profile);
  if (!result.ok) return { problem: result.reason };
  // The name on live stories, the home pin and the map opt-in all show on the globe.
  expireGlobe();
  redirect(memberPath(locale, "?notice=profile"));
}
