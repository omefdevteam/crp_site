import type { Applicant } from "@/lib/db";

// The applicant statuses that make someone an Ambassador: accepted, and every
// stage after acceptance. An applicant who leaves this set (a corrected
// decision, interview_no, ineligible) keeps the account row and its stories,
// but cannot sign in, and their stories leave the globe, until they return.
export const AMBASSADOR_STATUSES = [
  "accepted",
  "interview_yes",
  "docs_submitted",
  "onboarding",
  "online",
] as const satisfies readonly Applicant["status"][];

export function isAmbassadorStatus(status: string): boolean {
  return (AMBASSADOR_STATUSES as readonly string[]).includes(status);
}
