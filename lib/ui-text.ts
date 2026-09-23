"use client";
import { useLanguage } from "@/components/LanguageProvider";
import en from "@/lib/translations/ui-en.json";
import fr from "@/lib/translations/ui-fr.json";
import es from "@/lib/translations/ui-es.json";
import pt from "@/lib/translations/ui-pt.json";
import type { Locale } from "@/lib/locale";
export const uiMessages: Record<Locale, Record<string, string>> = { en, fr, es, pt };
export function uiText(locale: Locale, text: string) { return uiMessages[locale][text] ?? text; }
export function useText() {
  const { locale } = useLanguage();
  return (text: string) => uiText(locale, text);
}
