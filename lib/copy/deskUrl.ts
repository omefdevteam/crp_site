import { locales } from "@/lib/locale";

/** The language the copy desk edits when the address names none (or one it does not know). */
export const DESK_DEFAULT_LANGUAGE = "en";

/** The `lang` search param, kept only when it names a site language. */
export function deskLanguage(value: string | null | undefined): string {
  return typeof value === "string" && (locales as readonly string[]).includes(value) ? value : DESK_DEFAULT_LANGUAGE;
}

/** The language shown for one entry: the chosen one when the entry has it, else its first. */
export function entryLanguage(chosen: string, available: readonly string[]): string {
  return available.includes(chosen) ? chosen : available[0] ?? DESK_DEFAULT_LANGUAGE;
}

export function deskHref(input: { catalog?: string; all?: boolean; review?: boolean; q?: string; key?: string; lang?: string }): string {
  const params = new URLSearchParams();
  if (input.all) params.set("all", "1");
  if (input.catalog) params.set("catalog", input.catalog);
  if (input.review) params.set("review", "1");
  if (input.q) params.set("q", input.q);
  if (input.key) params.set("key", input.key);
  if (input.lang && input.lang !== DESK_DEFAULT_LANGUAGE) params.set("lang", input.lang);
  const query = params.toString();
  return query ? `/admin/copy?${query}` : "/admin/copy";
}
