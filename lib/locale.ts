export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "crp-locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "fr";
}

export function parseLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  try {
    window.localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    // Private mode can block storage; the cookie is enough.
  }
  document.documentElement.lang = locale;
}
