import type { Locale } from "@/lib/locale";

// Ambassador pages live under the public locale prefix, /{lang}/ambassador.
// As with staff links, the one-time code rides in the URL fragment, which the
// browser never sends to the server, so it stays out of request logs.
export const MEMBER_BASE = "/ambassador";

export function memberPath(locale: Locale, rest = ""): string {
  return `/${locale}${MEMBER_BASE}${rest}`;
}

export function memberSignInLink(base: string, locale: Locale, raw: string): string {
  return `${base}${memberPath(locale, "/confirm")}#token=${encodeURIComponent(raw)}`;
}

// True for /{lang}/ambassador and everything under it.
export function isMemberPath(pathname: string): boolean {
  return /^\/[a-z]{2}\/ambassador(\/|$)/.test(pathname);
}
