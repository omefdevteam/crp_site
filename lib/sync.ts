import { z } from "zod";
import type { Applicant } from "@/lib/db";

type Status = Applicant["status"];

// One decision row as the Excel poll sends it. Blank cells arrive as "" and are
// normalized to undefined before parsing. `version` is the applicant version the
// sheet last saw, so a stale row cannot overwrite a newer decision; `decisionId`
// lets a retried request replay its stored result instead of re-applying.
export const decisionRow = z.object({
  applicantId: z.uuid(),
  decisionId: z.uuid().optional(),
  version: z.coerce.number().int().nonnegative().optional(),
  reviewDecision: z.enum(["accept", "reject"]).optional(),
  reviewNotes: z.string().optional(),
  reviewer: z.string().optional(),
  reviewDate: z.string().optional(),
  interviewOutcome: z.enum(["yes", "no"]).optional(),
  interviewNotes: z.string().optional(),
  interviewDate: z.string().optional(),
});
export const decisionsInput = z.array(decisionRow).max(500);
export type DecisionRow = z.infer<typeof decisionRow>;

export function normalizeDecisions(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map((row) =>
    row && typeof row === "object"
      ? Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k, v === "" ? undefined : v]),
        )
      : row,
  );
}

// The status a set of decisions implies. Later stages win, so an interview
// outcome supersedes the review decision. null means no decision yet.
export function targetStatus(d: DecisionRow): Status | null {
  if (d.interviewOutcome === "no") return "interview_no";
  if (d.interviewOutcome === "yes") return "interview_yes";
  if (d.reviewDecision === "reject") return "rejected";
  if (d.reviewDecision === "accept") return "accepted";
  return null;
}

// Review corrections are allowed within their stage, but old spreadsheet
// decisions must never undo an interview, document submission, or onboarding.
export function decisionSourceStatuses(target: Status): Status[] {
  const review: Status[] = [
    "submitted", "round1_complete", "id_verified", "id_failed", "accepted", "rejected",
  ];
  if (target === "accepted" || target === "rejected") return review;
  if (target === "interview_yes" || target === "interview_no") {
    return [...review, "interview_yes", "interview_no"];
  }
  return [];
}

// A real Date or undefined; an unparseable cell is dropped, not stored as junk.
export function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const t = Date.parse(value);
  return Number.isNaN(t) ? undefined : new Date(t);
}

// The system-owned projection of an applicant that the Excel mirror reads. The
// decision columns are deliberately absent so the sheet never writes them back
// to itself; `version` lets it detect its own stale rows.
export function applicantSyncRow(a: Applicant) {
  return {
    id: a.id,
    version: a.version,
    submittedAt: a.createdAt,
    fullName: a.fullName,
    email: a.email,
    dob: a.dob,
    age: a.age,
    track: a.track,
    phone: a.phone,
    nationality: a.nationality,
    basedIn: a.basedIn,
    skills: a.skills,
    canTravel: a.canTravel,
    hasValidPassport: a.hasValidPassport,
    language: a.language,
    status: a.status,
    round1Link: null, // Private form references are delivered only to the verified applicant.
    round1CompletedAt: a.round1CompletedAt,
    identityStatus: a.identityStatus,
    identityCheckedAt: a.identityCheckedAt,
    interviewAt: a.interviewAt,
    docsStatus: a.docsStatus,
    lastSynced: a.updatedAt,
  };
}
