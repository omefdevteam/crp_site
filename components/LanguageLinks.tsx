"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { locales, localePath, nativeLanguageNames } from "@/lib/locale";
export function LanguageLinks() {
  const { locale, path: initialPath } = useLanguage();
  const pathname = usePathname();
  const [path, setPath] = useState(initialPath);
  useEffect(() => { setPath(pathname); }, [pathname]);
  return <nav aria-label="Languages / Langues / Idiomas" className="flex flex-wrap justify-center gap-x-5 gap-y-2 py-5 text-sm">
    {locales.map((code) => <a key={code} href={localePath(path, code)} hrefLang={code} lang={code} aria-current={locale === code ? "page" : undefined} className="underline underline-offset-4">{nativeLanguageNames[code]}</a>)}
  </nav>;
}
