"use client";

import type { StoryStatus } from "@/lib/db/schema";
import { useText } from "@/lib/ui-text";

const TONE: Record<StoryStatus, string> = {
  draft: "bg-black/5 text-black",
  submitted: "bg-[#fff1e2] text-[#8a4a00]",
  approved: "bg-lime text-black",
  rejected: "bg-[#fde4f1] text-[#a3115f]",
  withdrawn: "bg-black/5 text-black/60",
};

export function StoryStatusBadge({ status }: { status: StoryStatus }) {
  const tr = useText();
  const label: Record<StoryStatus, string> = {
    draft: tr("Draft"),
    submitted: tr("With our team"),
    approved: tr("Live on the globe"),
    rejected: tr("Needs changes"),
    withdrawn: tr("Withdrawn"),
  };
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide ${TONE[status]}`}>{label[status]}</span>;
}

// The page-level notices that actions redirect with (?notice=...).
export function MemberNotice({ notice, missing }: { notice: string | undefined; missing?: string }) {
  const tr = useText();
  if (!notice) return null;
  const parts = (missing ?? "").split(",").filter(Boolean);
  const missingText = parts.map((part) => ({ title: tr("a title"), body: tr("the story"), place: tr("a city or town") })[part] ?? part).join(", ");
  const text: Record<string, string> = {
    saved: tr("Draft saved."),
    submitted: tr("Sent. Our team will read it and email you."),
    withdrawn: tr("Withdrawn. You can edit it and send it again."),
    deleted: tr("Story deleted."),
    profile: tr("Profile saved."),
    incomplete: `${tr("Saved as a draft. Before sending, add:")} ${missingText}.`,
    pending_limit: tr("Saved as a draft. You already have 5 stories with our team. Send this one when one of them is reviewed."),
    locked: tr("This story is with our team. Withdraw it first to make changes."),
    not_found: tr("This story could not be found."),
  };
  const ok = ["saved", "submitted", "withdrawn", "deleted", "profile"].includes(notice);
  return (
    <p role="status" className={`rounded-3xl px-5 py-3 text-sm ${ok ? "bg-lime/60 text-black" : "bg-[#fde4f1] text-[#a3115f]"}`}>
      {text[notice] ?? tr("Something went wrong. Try again.")}
    </p>
  );
}
