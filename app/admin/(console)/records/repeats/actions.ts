"use server";

import { revalidatePath } from "next/cache";
import { duplicateStatuses } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import { decideMatch, type DecideVerb } from "@/lib/duplicates/review";
import { assertStaffAction } from "@/lib/staff/gate";

export type RepeatFormState = { readonly result: "saved" | "forbidden" | "invalid" | "not_found" | "stale" | "not_installed" } | null;

const VERBS: readonly DecideVerb[] = ["confirm", "dismiss", "reopen"];

export async function decideRepeatAction(_previous: RepeatFormState, formData: FormData): Promise<RepeatFormState> {
  // The per-list permission is checked in decideMatch against the match's list.
  const staff = await assertStaffAction("dashboard.read");
  if (!staff) return { result: "forbidden" };
  const verb = String(formData.get("verb") ?? "") as DecideVerb;
  const expected = String(formData.get("expected") ?? "");
  const path = String(formData.get("path") ?? "");
  if (!VERBS.includes(verb) || !(duplicateStatuses as readonly string[]).includes(expected)) return { result: "invalid" };
  const result = await decideMatch(getDb(), staff, {
    matchId: String(formData.get("matchId") ?? ""),
    verb,
    expected: expected as (typeof duplicateStatuses)[number],
  });
  if (!result.ok) return { result: result.reason };
  if (/^\/admin\/records\/(applicants|partners|messages)\/[0-9a-f-]{36}$/i.test(path)) revalidatePath(path);
  revalidatePath("/admin/records");
  revalidatePath("/admin");
  return { result: "saved" };
}
