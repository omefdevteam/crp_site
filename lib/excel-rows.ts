// Column names match excel/generate-review-workbook.mjs. Cream columns are the
// system's; yellow columns belong to reviewers and must survive a pull.

export const APPLICANT_SYSTEM = [
  "id", "version", "submittedAt", "fullName", "email", "dob", "age", "track", "phone",
  "nationality", "basedIn", "skills", "canTravel", "hasValidPassport", "language", "status",
  "round1Link", "round1CompletedAt", "identityStatus", "identityCheckedAt", "interviewAt",
  "docsStatus", "lastSynced",
] as const;

export const APPLICANT_TEAM = [
  "reviewDecision", "reviewNotes", "reviewer", "reviewDate",
  "interviewOutcome", "interviewNotes", "interviewDate", "decisionId",
] as const;

export const APPLICANT_COLUMNS = [...APPLICANT_SYSTEM, ...APPLICANT_TEAM];

export const WAITLIST_COLUMNS = ["id", "createdAt", "updatedAt", "email", "name", "source", "status"];
export const INTEREST_COLUMNS = ["id", "createdAt", "updatedAt", "email", "name", "ageGroup", "track", "source"];
export const NOMINATION_COLUMNS = [
  "id", "createdAt", "updatedAt", "nominatorName", "nominatorEmail", "nominatorPhone",
  "nominatorOrganization", "nominatorRelation", "nomineeName", "nomineeEmail", "nomineeDob",
  "nomineePhone", "nomineeNationality", "nomineeBasedIn", "nomineeLocation", "track",
  "videoaskLink", "status",
];

export const EXCEL_TABLES = {
  applicants: "Applicants",
  waitlist: "Waitlist",
  interest: "Interest",
  nominations: "Nominations",
} as const;

export type Cell = string | number | boolean | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function cellText(value: Cell | undefined): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

// Graph returns real datetimes as Excel serials (days since 1899-12-30).
export function cellDate(value: Cell | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(Date.UTC(1899, 11, 30) + value * 86_400_000).toISOString();
  }
  return cellText(value);
}

export function formatSyncCell(value: unknown): Cell {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") return value;
  return String(value);
}

export function padRow(values: Cell[], length: number): Cell[] {
  const copy = values.slice(0, length);
  while (copy.length < length) copy.push("");
  return copy;
}

// `writable` limits which headers the payload may replace. Null writes every
// header the payload actually contains. Reviewer columns stay as `existing`.
export function mergeRow(
  headers: string[],
  existing: Cell[] | null,
  payload: Record<string, unknown>,
  writable: readonly string[] | null,
): Cell[] {
  const allow = writable ? new Set<string>(writable) : null;
  return headers.map((header, i) => {
    if ((allow === null || allow.has(header)) && Object.prototype.hasOwnProperty.call(payload, header)) {
      return formatSyncCell(payload[header]);
    }
    return existing?.[i] ?? "";
  });
}

function headerValue(headers: string[], values: Cell[], name: string): Cell | undefined {
  const index = headers.indexOf(name);
  return index < 0 ? undefined : values[index];
}

// A sheet row that should be pushed. Blank ids and rows with no decision are
// ignored. A missing decisionId is omitted so the caller can mint one and write
// it back before applying.
export function readApplicantDecision(headers: string[], values: Cell[]): Record<string, unknown> | null {
  const id = cellText(headerValue(headers, values, "id"));
  if (!UUID.test(id)) return null;
  const reviewDecision = cellText(headerValue(headers, values, "reviewDecision"));
  const interviewOutcome = cellText(headerValue(headers, values, "interviewOutcome"));
  if (!reviewDecision && !interviewOutcome) return null;

  const input: Record<string, unknown> = { applicantId: id.toLowerCase() };
  const decisionId = cellText(headerValue(headers, values, "decisionId"));
  if (UUID.test(decisionId)) input.decisionId = decisionId.toLowerCase();

  const version = cellText(headerValue(headers, values, "version"));
  if (version) input.version = version;
  if (reviewDecision) input.reviewDecision = reviewDecision;
  const reviewNotes = cellText(headerValue(headers, values, "reviewNotes"));
  if (reviewNotes) input.reviewNotes = reviewNotes;
  const reviewer = cellText(headerValue(headers, values, "reviewer"));
  if (reviewer) input.reviewer = reviewer;
  const reviewDate = cellDate(headerValue(headers, values, "reviewDate"));
  if (reviewDate) input.reviewDate = reviewDate;
  if (interviewOutcome) input.interviewOutcome = interviewOutcome;
  const interviewNotes = cellText(headerValue(headers, values, "interviewNotes"));
  if (interviewNotes) input.interviewNotes = interviewNotes;
  const interviewDate = cellDate(headerValue(headers, values, "interviewDate"));
  if (interviewDate) input.interviewDate = interviewDate;
  return input;
}
