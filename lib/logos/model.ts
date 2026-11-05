// Partner and funder logos that staff manage under Website text. This file is
// pure (no DB, no Blob, no Next) so the public page, the dashboard and the
// tests all share one set of rules.

export const LOGO_BYTE_CAP = 512 * 1024;
export const LOGO_NAME_MAX = 120;
export const LOGO_LINK_MAX = 500;
// The row on the Programs page fits four overlapping circles on a phone.
export const LOGOS_PER_GROUP_MAX = 4;

export type LogoContentType = "image/png" | "image/jpeg" | "image/svg+xml" | "image/webp";
export const LOGO_TYPES: Readonly<Record<LogoContentType, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

/** How a logo sits in its circle. Built-in art keeps its Figma treatment; uploads fit inside a white circle. */
export type LogoFit = "cover" | "framed" | "inside";

export type BuiltinLogo = {
  readonly id: string;
  readonly name: string;
  readonly src: string;
  readonly fit: LogoFit;
};

export type LogoGroupId = "programs.partners" | "programs.funders";

export type LogoGroup = {
  readonly id: LogoGroupId;
  readonly label: string;
  readonly where: string;
  readonly builtins: readonly BuiltinLogo[];
};

const photo = (file: string) => `/images/programs/${file}`;

// Order is the order on the page. Names are what screen readers read out.
export const LOGO_GROUPS: readonly LogoGroup[] = [
  {
    id: "programs.partners",
    label: "Partner logos",
    where: "Programs page, next to “Developing and activating local missions”",
    builtins: [
      { id: "partner-1", name: "Africa Climate Mobility Initiative", src: photo("practice-partner-1.jpg"), fit: "cover" },
      { id: "partner-2", name: "Climate Action Network South Africa", src: photo("practice-partner-2.jpg"), fit: "cover" },
      { id: "partner-3", name: "Climate Communications and Local Governance – Africa", src: photo("practice-partner-3.jpg"), fit: "cover" },
    ],
  },
  {
    id: "programs.funders",
    label: "Funder logos",
    where: "Programs page, next to “Participating in funded projects”",
    builtins: [
      { id: "funder-1", name: "Sony", src: photo("practice-funder-1.jpg"), fit: "framed" },
      { id: "funder-2", name: "Adobe", src: photo("practice-funder-2.jpg"), fit: "cover" },
      { id: "funder-3", name: "Figma", src: photo("practice-funder-3.jpg"), fit: "cover" },
    ],
  },
];

export function logoGroup(id: string): LogoGroup | null {
  return LOGO_GROUPS.find((group) => group.id === id) ?? null;
}

export function builtinLogo(group: LogoGroup, id: string | null | undefined): BuiltinLogo | null {
  if (!id) return null;
  return group.builtins.find((logo) => logo.id === id) ?? null;
}

/** What the public page draws for one logo. Plain data so it can cross to client components. */
export type ShownLogo = {
  readonly key: string;
  readonly name: string;
  readonly src: string;
  readonly fit: LogoFit;
  readonly link: string | null;
};

export type SiteLogos = Readonly<Record<LogoGroupId, readonly ShownLogo[]>>;

/** One stored row, as read from site_logos. */
export type LogoRow = {
  readonly id: string;
  readonly logoGroup: string;
  readonly position: number;
  readonly name: string;
  readonly linkUrl: string | null;
  readonly builtin: string | null;
  readonly url: string | null;
};

function builtinShown(group: LogoGroup): readonly ShownLogo[] {
  return group.builtins.map((logo) => ({ key: `builtin:${logo.id}`, name: logo.name, src: logo.src, fit: logo.fit, link: null }));
}

export const BUILTIN_LOGOS: SiteLogos = Object.fromEntries(
  LOGO_GROUPS.map((group) => [group.id, builtinShown(group)]),
) as unknown as SiteLogos;

// A group with no usable rows shows the built-in logos. A row that no longer
// makes sense (an unknown built-in, a URL that is not a public logo file) is
// skipped rather than drawn broken.
export function shownLogos(rows: readonly LogoRow[]): SiteLogos {
  const out = {} as Record<LogoGroupId, readonly ShownLogo[]>;
  for (const group of LOGO_GROUPS) {
    const mine = rows
      .filter((row) => row.logoGroup === group.id)
      .slice()
      .sort((a, b) => a.position - b.position || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const shown = mine.flatMap((row): ShownLogo[] => {
      const builtin = builtinLogo(group, row.builtin);
      const link = row.linkUrl && parseLogoLink(row.linkUrl).ok ? row.linkUrl : null;
      if (builtin) return [{ key: row.id, name: row.name, src: builtin.src, fit: builtin.fit, link }];
      if (row.builtin || !row.url || !isPublicLogoUrl(row.url)) return [];
      return [{ key: row.id, name: row.name, src: row.url, fit: "inside", link }];
    });
    out[group.id] = shown.length > 0 ? shown : BUILTIN_LOGOS[group.id];
  }
  return out;
}

export function isPublicLogoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com") && !url.username && !url.password;
  } catch {
    return false;
  }
}

// ---- Validation ----

export type LogoProblem =
  | "name-missing"
  | "name-too-long"
  | "link-invalid"
  | "file-missing"
  | "file-too-big"
  | "file-type"
  | "file-unsafe"
  | "not-found"
  | "last-logo"
  | "full"
  | "storage-off"
  | "storage-failed"
  | "not-ready";

export const LOGO_PROBLEM_TEXT: Readonly<Record<LogoProblem, string>> = {
  "name-missing": "Give the logo a name. Screen readers read it out to people who can’t see the logo.",
  "name-too-long": `Keep the name under ${LOGO_NAME_MAX} characters.`,
  "link-invalid": "The link must be a full web address starting with https://, or leave it empty.",
  "file-missing": "Choose an image file for the logo.",
  "file-too-big": "That file is too big. Logos must be 500 KB or smaller.",
  "file-type": "That file type isn’t supported. Use a PNG, JPG, SVG or WebP image.",
  "file-unsafe": "That SVG file contains scripts, links or other content we can’t show safely. Export it again as a plain SVG, or use a PNG.",
  "not-found": "That logo was changed by someone else. Check the list and try again.",
  "last-logo": "Each group needs at least one logo. Add the new logo first, or use Replace.",
  "full": `Each group can show up to ${LOGOS_PER_GROUP_MAX} logos. Remove one before adding another.`,
  "storage-off": "Uploading logos isn’t switched on yet. You can still rename, reorder or remove logos.",
  "storage-failed": "The logo couldn’t be uploaded. Nothing changed. Try again in a minute.",
  "not-ready": "Logo editing isn’t switched on yet. Nothing changed.",
};

type Parsed<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly problem: LogoProblem };

const CONTROL = /[\u0000-\u001f\u007f]/g;
const HAS_CONTROL = /[\u0000-\u001f\u007f]/;

export function parseLogoName(input: unknown): Parsed<string> {
  const value = typeof input === "string" ? input.replace(CONTROL, " ").replace(/\s+/g, " ").trim() : "";
  if (!value) return { ok: false, problem: "name-missing" };
  if (value.length > LOGO_NAME_MAX) return { ok: false, problem: "name-too-long" };
  return { ok: true, value };
}

export function parseLogoLink(input: unknown): Parsed<string | null> {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return { ok: true, value: null };
  if (raw.length > LOGO_LINK_MAX || HAS_CONTROL.test(raw)) return { ok: false, problem: "link-invalid" };
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password) return { ok: false, problem: "link-invalid" };
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, problem: "link-invalid" };
  }
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

/** The file's real type from its first bytes. The browser's claimed type is not trusted. */
export function sniffLogoType(bytes: Uint8Array): LogoContentType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 4096)).replace(/^\uFEFF/, "");
  // An SVG starts with optional XML prolog / comments, then an <svg> root.
  if (/^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) return "image/svg+xml";
  // An SVG doctype (possibly with entities) is still an SVG; unsafeSvg refuses it.
  if (/^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*<!DOCTYPE\s+svg\b/i.test(head)) return "image/svg+xml";
  return null;
}

// Logos are shown with <img>, where SVG scripts never run, but the file is
// also reachable at its own URL. Rather than rewrite files, refuse anything
// that could run code, pull in other files or point somewhere else.
const SVG_FORBIDDEN: readonly RegExp[] = [
  /<!DOCTYPE/i,
  /<!ENTITY/i,
  /<\s*script/i,
  /<\s*foreignObject/i,
  /<\s*(iframe|embed|object|audio|video|canvas|handler|listener)\b/i,
  /<\s*a[\s>]/i,
  /<\s*(set|animate|animateMotion|animateTransform)\b/i,
  /\son[a-z]+\s*=/i,
  /javascript:/i,
  /vbscript:/i,
  /@import/i,
  /<\?xml-stylesheet/i,
];

export function unsafeSvg(text: string): boolean {
  if (SVG_FORBIDDEN.some((pattern) => pattern.test(text))) return true;
  // Links may only point inside the file, or at an embedded PNG/JPEG/WebP.
  for (const match of text.matchAll(/\b(?:xlink:)?href\s*=\s*(["'])([\s\S]*?)\1/gi)) {
    const target = (match[2] ?? "").trim();
    if (!target.startsWith("#") && !/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(target)) return true;
  }
  for (const match of text.matchAll(/url\(\s*(["']?)([^)"']*)\1\s*\)/gi)) {
    if (!(match[2] ?? "").trim().startsWith("#")) return true;
  }
  return false;
}

export type CheckedLogoFile = { readonly bytes: Uint8Array; readonly contentType: LogoContentType; readonly extension: string };

export function checkLogoFile(bytes: Uint8Array | null | undefined): Parsed<CheckedLogoFile> {
  if (!bytes || bytes.length === 0) return { ok: false, problem: "file-missing" };
  if (bytes.length > LOGO_BYTE_CAP) return { ok: false, problem: "file-too-big" };
  const contentType = sniffLogoType(bytes);
  if (!contentType) return { ok: false, problem: "file-type" };
  if (contentType === "image/svg+xml") {
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return { ok: false, problem: "file-unsafe" };
    }
    if (unsafeSvg(text)) return { ok: false, problem: "file-unsafe" };
  }
  return { ok: true, value: { bytes, contentType, extension: LOGO_TYPES[contentType] } };
}

/** "builtin:<id>" for a built-in logo not yet copied into the table, otherwise a row id. */
export type LogoRef = { readonly kind: "builtin"; readonly builtin: string } | { readonly kind: "row"; readonly id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseLogoRef(group: LogoGroup, input: unknown): LogoRef | null {
  if (typeof input !== "string") return null;
  if (input.startsWith("builtin:")) {
    const id = input.slice("builtin:".length);
    return builtinLogo(group, id) ? { kind: "builtin", builtin: id } : null;
  }
  return UUID.test(input) ? { kind: "row", id: input.toLowerCase() } : null;
}
