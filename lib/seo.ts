import type { Metadata } from "next";
import { copyFor } from "@/lib/messages";
import { locales, localePath, type Locale } from "@/lib/locale";
export const SITE_URL = "https://www.climaterefugeepavilion.org";
export const pagePaths = { home: "/", about: "/about", programs: "/programs", partner: "/partner", contact: "/contact", apply: "/apply", nominate: "/nominate", privacy: "/privacy" } as const;
export type PageKey = keyof typeof pagePaths;
export function languageAlternates(path: string) {
  return Object.fromEntries([...locales.map((locale) => [locale, SITE_URL + localePath(path, locale)]), ["x-default", SITE_URL + localePath(path, "en")]]);
}
export function pageMetadata(locale: Locale, page: PageKey): Metadata {
  const meta = copyFor(locale).meta[page];
  const canonical = SITE_URL + localePath(pagePaths[page], locale);
  const ogLocales = { en: "en_US", fr: "fr_FR", es: "es_ES", pt: "pt_PT" };
  return {
    ...meta, metadataBase: new URL(SITE_URL),
    alternates: { canonical, languages: languageAlternates(pagePaths[page]) },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: { type: "website", siteName: "Climate Refugee Pavilion", title: meta.title, description: meta.description, url: canonical, locale: ogLocales[locale], alternateLocale: locales.filter((lang) => lang !== locale).map((lang) => ogLocales[lang]), images: [{ url: `${SITE_URL}/icon.png`, alt: "Climate Refugee Pavilion" }] },
    twitter: { card: "summary", title: meta.title, description: meta.description, images: [`${SITE_URL}/icon.png`] },
  };
}
export function structuredData(locale: Locale, page: PageKey) {
  const url = SITE_URL + localePath(pagePaths[page], locale);
  const meta = copyFor(locale).meta[page];
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Climate Refugee Pavilion", url: SITE_URL, logo: `${SITE_URL}/icon.png` },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "Climate Refugee Pavilion", inLanguage: [...locales], publisher: { "@id": `${SITE_URL}/#organization` } },
    { "@type": "WebPage", "@id": `${url}#webpage`, url, name: meta.title, description: meta.description, inLanguage: locale, isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${SITE_URL}/#organization` } },
    ...(page === "home" ? [] : [{ "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Climate Refugee Pavilion", item: SITE_URL + localePath("/", locale) },
      { "@type": "ListItem", position: 2, name: meta.title, item: url },
    ] }]),
  ] };
}
