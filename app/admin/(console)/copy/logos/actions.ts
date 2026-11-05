"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { addLogo, logoStoreFromEnv, moveLogo, removeLogo, replaceLogo, updateLogo, type LogoResult } from "@/lib/logos/manage";
import { LOGO_BYTE_CAP } from "@/lib/logos/model";
import { assertStaffAction } from "@/lib/staff/gate";

// Every logo change goes live straight away, so it needs the same permission
// as publishing Website text.

function back(group: string, result: LogoResult, done: string): never {
  const params = new URLSearchParams();
  if (group) params.set("group", group);
  if (result.ok) params.set("done", done);
  else params.set("error", result.reason);
  redirect(`/admin/copy/logos?${params.toString()}#${encodeURIComponent(group)}`);
}

async function fileBytes(value: FormDataEntryValue | null): Promise<Uint8Array | null> {
  if (!value || typeof value === "string" || value.size === 0) return null;
  // Over the cap: refuse without reading it all (checkLogoFile reports the size).
  if (value.size > LOGO_BYTE_CAP) return new Uint8Array(LOGO_BYTE_CAP + 1);
  return new Uint8Array(await value.arrayBuffer());
}

async function staffOrSignIn() {
  const staff = await assertStaffAction("copy.publish");
  if (!staff) redirect("/admin/sign-in");
  return staff;
}

export async function addLogoAction(formData: FormData) {
  const staff = await staffOrSignIn();
  const group = String(formData.get("group") ?? "");
  const result = await addLogo(getDb(), logoStoreFromEnv(), staff.id, {
    group,
    name: formData.get("name"),
    link: formData.get("link"),
    file: await fileBytes(formData.get("file")),
  });
  back(group, result, "added");
}

export async function replaceLogoAction(formData: FormData) {
  const staff = await staffOrSignIn();
  const group = String(formData.get("group") ?? "");
  const result = await replaceLogo(getDb(), logoStoreFromEnv(), staff.id, {
    group,
    ref: formData.get("ref"),
    file: await fileBytes(formData.get("file")),
  });
  back(group, result, "replaced");
}

export async function updateLogoAction(formData: FormData) {
  const staff = await staffOrSignIn();
  const group = String(formData.get("group") ?? "");
  const result = await updateLogo(getDb(), staff.id, { group, ref: formData.get("ref"), name: formData.get("name"), link: formData.get("link") });
  back(group, result, "saved");
}

export async function removeLogoAction(formData: FormData) {
  const staff = await staffOrSignIn();
  const group = String(formData.get("group") ?? "");
  const result = await removeLogo(getDb(), logoStoreFromEnv(), staff.id, { group, ref: formData.get("ref") });
  back(group, result, "removed");
}

export async function moveLogoAction(formData: FormData) {
  const staff = await staffOrSignIn();
  const group = String(formData.get("group") ?? "");
  const result = await moveLogo(getDb(), staff.id, { group, ref: formData.get("ref"), direction: formData.get("direction") });
  back(group, result, "moved");
}
