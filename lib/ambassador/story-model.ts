import type { StoryKind, StoryStatus } from "@/lib/db/schema";
import { isLocale, type Locale } from "@/lib/locale";

// Pure rules for Ambassador stories. No database here, so tests can cover
// every case directly. lib/ambassador/stories.ts applies them in transactions.

export const TITLE_MAX = 120;
export const BODY_MAX = 1000;
export const PENDING_MAX = 5;
export const STORIES_MAX = 50;

// What the Ambassador may do to a story in each status. A submitted story is
// locked while staff read it; withdrawing it unlocks it. Editing a rejected or
// withdrawn story turns it back into a draft.
export const EDITABLE: readonly StoryStatus[] = ["draft", "rejected", "withdrawn"];
export const SUBMITTABLE: readonly StoryStatus[] = ["draft", "rejected", "withdrawn"];
export const WITHDRAWABLE: readonly StoryStatus[] = ["submitted", "approved"];
export const DELETABLE: readonly StoryStatus[] = ["draft", "rejected", "withdrawn"];

export function canEdit(status: StoryStatus): boolean {
  return EDITABLE.includes(status);
}

export type StoryDraft = {
  readonly kind: StoryKind;
  readonly title: string | null;
  readonly body: string | null;
  readonly language: Locale;
  readonly placeId: number | null;
};

export type DraftProblem = "kind" | "title_long" | "body_long" | "language" | "place";

function clean(raw: unknown, max: number): { value: string | null; tooLong: boolean } {
  // Line breaks are kept (the body is shown as paragraphs); other control
  // characters are dropped.
  const text = String(raw ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim();
  if (!text) return { value: null, tooLong: false };
  return { value: text, tooLong: [...text].length > max };
}

// A draft may be incomplete. Only the shape is checked here; completeness is
// checked on submit.
export function parseDraft(input: {
  kind?: unknown;
  title?: unknown;
  body?: unknown;
  language?: unknown;
  placeId?: unknown;
}): { ok: true; draft: StoryDraft } | { ok: false; problem: DraftProblem } {
  if (input.kind !== "beacon" && input.kind !== "mission") return { ok: false, problem: "kind" };
  const title = clean(input.title, TITLE_MAX);
  if (title.tooLong) return { ok: false, problem: "title_long" };
  const body = clean(input.body, BODY_MAX);
  if (body.tooLong) return { ok: false, problem: "body_long" };
  const language = String(input.language ?? "");
  if (!isLocale(language)) return { ok: false, problem: "language" };
  const rawPlace = String(input.placeId ?? "").trim();
  let placeId: number | null = null;
  if (rawPlace) {
    if (!/^\d{1,7}$/.test(rawPlace)) return { ok: false, problem: "place" };
    placeId = Number(rawPlace);
  }
  return { ok: true, draft: { kind: input.kind, title: title.value, body: body.value, language, placeId } };
}

export type MissingPart = "title" | "body" | "place";

export function missingForSubmit(story: { title: string | null; body: string | null; lat: number | null; city: string | null }): MissingPart[] {
  const missing: MissingPart[] = [];
  if (!story.title) missing.push("title");
  if (!story.body) missing.push("body");
  if (story.lat == null || !story.city) missing.push("place");
  return missing;
}

// ---- Photos ----

// Vercel refuses request bodies over 4.5 MB. The browser shrinks photos first.
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

// The file's own first bytes decide its type. The browser's claim is ignored,
// so a renamed file of another kind is refused.
export function sniffPhoto(bytes: Uint8Array): PhotoType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  if (
    bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return "image/webp";
  return null;
}

export const PHOTO_EXT: Record<PhotoType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// ---- Profile ----

export const DISPLAY_NAME_MAX = 60;
export const BIO_MAX = 280;

export type ProfileInput = {
  readonly displayName: string;
  readonly bio: string | null;
  // "keep" leaves the saved home as it is; null clears it.
  readonly homePlaceId: number | "keep" | null;
  readonly showOnGlobe: boolean;
  readonly language: Locale;
};

export type ProfileProblem = "name" | "name_long" | "bio_long" | "place" | "language" | "globe_needs_home";

export function parseProfile(input: {
  displayName?: unknown;
  bio?: unknown;
  homePlaceId?: unknown;
  showOnGlobe?: unknown;
  language?: unknown;
}): { ok: true; profile: ProfileInput } | { ok: false; problem: ProfileProblem } {
  const name = clean(input.displayName, DISPLAY_NAME_MAX);
  if (!name.value) return { ok: false, problem: "name" };
  if (name.tooLong || name.value.includes("\n")) return { ok: false, problem: "name_long" };
  const bio = clean(input.bio, BIO_MAX);
  if (bio.tooLong) return { ok: false, problem: "bio_long" };
  const language = String(input.language ?? "");
  if (!isLocale(language)) return { ok: false, problem: "language" };
  const rawPlace = String(input.homePlaceId ?? "").trim();
  let homePlaceId: number | "keep" | null = null;
  if (rawPlace === "keep") homePlaceId = "keep";
  else if (rawPlace) {
    if (!/^\d{1,7}$/.test(rawPlace)) return { ok: false, problem: "place" };
    homePlaceId = Number(rawPlace);
  }
  const showOnGlobe = input.showOnGlobe === "on" || input.showOnGlobe === true;
  if (showOnGlobe && homePlaceId === null) return { ok: false, problem: "globe_needs_home" };
  return { ok: true, profile: { displayName: name.value, bio: bio.value, homePlaceId, showOnGlobe, language } };
}
