"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../LanguageProvider";

// Full-screen cream shell shared by apply + nominate multi-step forms.
export function FormShell({
  onBack,
  children,
  footer,
  fill = false,
}: {
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  fill?: boolean;
}) {
  const { locale, setLocale } = useLanguage();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex h-dvh flex-col overflow-hidden bg-cream">
      <header className="flex shrink-0 items-center justify-between px-4 py-2.5 desk:px-12 desk:py-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="grid size-9 place-items-center rounded-full bg-white shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/apply/arrow-left.svg" alt="" width={20} height={20} className="size-5" />
          </button>
        ) : (
          <span className="size-9" />
        )}

        <div className="flex items-center rounded-full bg-white p-1">
          {(["en", "fr"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={locale === code}
              className={`h-7 rounded-full px-3.5 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors ${
                locale === code ? "bg-black text-white" : "bg-transparent text-black/50"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </header>

      <main
        className={`flex min-h-0 flex-1 justify-center px-3 pb-2 ${
          fill ? "items-stretch" : "items-center"
        }`}
      >
        <div
          className={`w-full max-w-[960px] overflow-hidden rounded-[36px] bg-white px-5 py-5 desk:rounded-[64px] desk:px-0 desk:py-8 ${
            fill ? "flex h-full min-h-0 flex-col" : ""
          }`}
        >
          <div
            className={`mx-auto flex w-full max-w-[632px] flex-col ${
              fill ? "min-h-0 flex-1" : ""
            }`}
          >
            {children}
          </div>
        </div>
      </main>

      {footer ? (
        <footer className="flex shrink-0 flex-col items-center gap-1.5 px-2.5 pb-2.5 pt-1">
          {footer}
        </footer>
      ) : null}
    </div>,
    document.body,
  );
}
