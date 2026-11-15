import type { DuplicateList } from "@/lib/db/schema";

// Which entries look like the same person sending the same form for the same
// purpose again. Pure: no database, so every rule is tested directly.
//
// Two things must both hold:
//  1. Same person: the same normalised email, the same phone number, or (for
//     applications) the same full name and date of birth. A name alone never
//     counts: many people share one.
//  2. Same purpose: per form (see SCOPE below). Different forms never match,
//     so an applicant who also sends a message is not a repeat.
//
// The scan only suggests. Staff confirm or dismiss, except for one narrow
// case: the same message or partner inquiry, word for word, from the same
// address within ten minutes is a double submit and is confirmed on its own.

export type Entry = {
  readonly id: string;
  readonly createdAt: Date;
  readonly email: string | null;
  readonly phone: string | null;
  readonly name: string | null;
  /** Applications only. ISO date. */
  readonly dob?: string | null;
  /** What the entry is for: track, organisation and support, or the message text. */
  readonly scope: string;
  /** Messages only: the text, compared for near-copies. */
  readonly body?: string | null;
};

export type Reason =
  | "same_email"
  | "same_phone"
  | "same_name_and_birth_date"
  | "same_track"
  | "same_organization_and_support"
  | "same_text"
  | "similar_text";

export type Pair = {
  readonly recordId: string;
  readonly originalId: string;
  readonly reasons: readonly Reason[];
  readonly automatic: boolean;
};

// How far apart two entries can be and still be one repeated attempt. An
// application is one per programme track whenever it arrives.
const WINDOW_DAYS: Record<DuplicateList, number | null> = { applicants: null, partners: 90, messages: 14 };
const DOUBLE_SUBMIT_MS = 10 * 60 * 1000;
// One entry is compared with at most this many earlier ones.
const PER_RECORD_MAX = 5;
// And looks at no more than this many earlier entries sharing a key, so one
// shared placeholder phone or address cannot make the scan quadratic.
const PER_RECORD_LOOK = 50;

export function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

const GMAIL = new Set(["gmail.com", "googlemail.com"]);

// Lower case, no "+tag", and for Gmail no dots: ada.l+apply@gmail.com and
// adal@googlemail.com are one inbox.
export function normalizeEmail(raw: string | null | undefined): string | null {
  const email = (raw ?? "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  let local = email.slice(0, at).split("+")[0] ?? "";
  let domain = email.slice(at + 1);
  if (GMAIL.has(domain)) {
    local = local.replaceAll(".", "");
    domain = "gmail.com";
  }
  return local ? `${local}@${domain}` : null;
}

// The last nine digits: "+254 712 345 678" and "0712345678" are one phone.
// Fewer than eight digits is not a usable phone number.
export function normalizePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.slice(-9);
}

function words(text: string): Set<string> {
  return new Set(fold(text).split(" ").filter((word) => word.length > 1));
}

// Jaccard overlap of the distinct words. Short texts must match exactly, so
// "Hi" and "Hello" never look alike.
export function textSimilarity(a: string, b: string): number {
  const left = words(a);
  const right = words(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / (left.size + right.size - shared);
}

type Keys = { email: string | null; phone: string | null; nameDob: string | null };

function keysOf(entry: Entry, list: DuplicateList): Keys {
  const name = entry.name ? fold(entry.name) : "";
  return {
    email: normalizeEmail(entry.email),
    phone: normalizePhone(entry.phone),
    // Two words at least: a first name and a birth date is too common.
    nameDob: list === "applicants" && entry.dob && name.split(" ").length >= 2 ? `${name}|${entry.dob}` : null,
  };
}

function samePerson(a: Keys, b: Keys): Reason[] {
  const reasons: Reason[] = [];
  if (a.email && a.email === b.email) reasons.push("same_email");
  if (a.phone && a.phone === b.phone) reasons.push("same_phone");
  if (a.nameDob && a.nameDob === b.nameDob) reasons.push("same_name_and_birth_date");
  return reasons;
}

function samePurpose(list: DuplicateList, later: Entry, earlier: Entry): { ok: boolean; reasons: Reason[]; exact: boolean } {
  if (list === "applicants") {
    const ok = later.scope === earlier.scope;
    return { ok, reasons: ok ? ["same_track"] : [], exact: false };
  }
  if (list === "partners") {
    const ok = later.scope === earlier.scope;
    return { ok, reasons: ok ? ["same_organization_and_support"] : [], exact: ok && fold(later.body ?? "") === fold(earlier.body ?? "") };
  }
  const a = later.body ?? "";
  const b = earlier.body ?? "";
  if (fold(a) === fold(b) && fold(a).length > 0) return { ok: true, reasons: ["same_text"], exact: true };
  const tooShort = Math.min(words(a).size, words(b).size) < 4;
  if (!tooShort && textSimilarity(a, b) >= 0.8) return { ok: true, reasons: ["similar_text"], exact: false };
  return { ok: false, reasons: [], exact: false };
}

// Every pair (later entry, earlier entry) that looks like one repeated
// attempt. Same input, same output, whatever order the entries came in.
export function findPairs(list: DuplicateList, entries: readonly Entry[]): Pair[] {
  const sorted = [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
  const keys = new Map(sorted.map((entry) => [entry.id, keysOf(entry, list)]));
  // Index earlier entries by each identity key, so the scan is not n².
  const byKey = new Map<string, Entry[]>();
  const pairs: Pair[] = [];
  const windowMs = WINDOW_DAYS[list] === null ? null : WINDOW_DAYS[list]! * 24 * 60 * 60 * 1000;

  for (const entry of sorted) {
    const mine = keys.get(entry.id)!;
    const ids = [mine.email && `e:${mine.email}`, mine.phone && `p:${mine.phone}`, mine.nameDob && `n:${mine.nameDob}`].filter(Boolean) as string[];
    const candidates = new Map<string, Entry>();
    for (const id of ids) for (const earlier of byKey.get(id) ?? []) candidates.set(earlier.id, earlier);

    const found: Pair[] = [];
    // Nearest first, so the cap keeps the most recent earlier attempts.
    const nearest = [...candidates.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id)).slice(0, PER_RECORD_LOOK);
    for (const earlier of nearest) {
      if (found.length >= PER_RECORD_MAX) break;
      const gap = entry.createdAt.getTime() - earlier.createdAt.getTime();
      // Nearest first: once one is outside the window, the rest are too.
      if (windowMs !== null && gap > windowMs) break;
      const person = samePerson(mine, keys.get(earlier.id)!);
      if (person.length === 0) continue;
      const purpose = samePurpose(list, entry, earlier);
      if (!purpose.ok) continue;
      const automatic = list !== "applicants" && purpose.exact && person.includes("same_email") && gap <= DOUBLE_SUBMIT_MS;
      found.push({ recordId: entry.id, originalId: earlier.id, reasons: [...person, ...purpose.reasons], automatic });
    }
    pairs.push(...found);
    for (const id of ids) {
      const bucket = byKey.get(id) ?? [];
      bucket.push(entry);
      byKey.set(id, bucket);
    }
  }
  return pairs;
}

export const REASON_LABEL: Record<Reason, string> = {
  same_email: "same email address",
  same_phone: "same phone number",
  same_name_and_birth_date: "same full name and date of birth",
  same_track: "same programme track",
  same_organization_and_support: "same organisation and type of support",
  same_text: "same message",
  similar_text: "almost the same message",
};
