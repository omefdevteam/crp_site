import type { MetadataRoute } from "next";
import { SITE_URL, pagePaths, languageAlternates } from "@/lib/seo";
import { locales, localePath } from "@/lib/locale";
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(pagePaths).flatMap((path) => locales.map((locale) => ({ url: SITE_URL + localePath(path, locale), alternates: { languages: languageAlternates(path) } })));
}
