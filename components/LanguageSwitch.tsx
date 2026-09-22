"use client";

import { locales } from "@/lib/locale";
import { t } from "@/lib/messages";
import { useLanguage } from "./LanguageProvider";

export function LanguageSwitch() {
  const { locale, setLocale, copy } = useLanguage();
  const selectedName = copy.a11y.languageNames[locale];
  const label = t(copy.a11y.changeLanguage, { language: selectedName });

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center rounded-full bg-white p-[4px]"
    >
      {locales.map((code) => {
        const selected = code === locale;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            onClick={() => setLocale(code)}
            className={`flex h-[32px] min-w-[52px] items-center justify-center rounded-full px-[12px] text-[14px] font-semibold uppercase leading-[0.9] tracking-[0.56px] ${
              selected ? "bg-black text-white" : "text-black/48"
            }`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
