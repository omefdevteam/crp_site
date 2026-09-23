"use client";

import { useEffect, useId, useRef, useState } from "react";
import { locales, localePath, nativeLanguageNames, type Locale } from "@/lib/locale";
import { t } from "@/lib/messages";
import { useLanguage } from "./LanguageProvider";

function CaretDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`size-[12px] shrink-0 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path
        d="M2.5 4.5L6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TranslateIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-[12px] shrink-0" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <circle cx="6" cy="6" r="5" />
        <path d="M1 6h10M6 1c1.6 1.5 2.4 3.2 2.4 5S7.6 9.5 6 11C4.4 9.5 3.6 7.8 3.6 6S4.4 2.5 6 1z" />
      </g>
    </svg>
  );
}

const MENU =
  "absolute right-0 top-[calc(100%+8px)] z-[60] min-w-full overflow-hidden rounded-[20px] bg-white p-[4px] text-black shadow-[0_8px_24px_rgba(0,0,0,0.18)]";
const OPTION =
  "flex w-full items-center justify-center rounded-full px-[12px] py-[8px] text-center font-semibold uppercase leading-[0.9]";

export function LanguageDropdown({
  variant,
}: {
  variant: "nav" | "compact" | "apply";
}) {
  const { locale, setLocale, copy, path } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selectedName = copy.a11y.languageNames[locale];
  const label = t(copy.a11y.changeLanguage, { language: selectedName });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  const trigger =
    variant === "nav" ? (
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex shrink-0 items-center rounded-full bg-white p-[4px] text-black shadow-[inset_0_0_18px_rgba(255,255,255,0.25)]"
      >
        <span className="flex h-[32px] items-center gap-[10px] rounded-full px-[12px] py-[10px]">
          <TranslateIcon />
          <span className="w-[28px] text-center text-[14px] font-semibold uppercase leading-[0.9] tracking-[0.56px] mix-blend-hard-light">
            {locale.toUpperCase()}
          </span>
        </span>
        <span className="flex items-center justify-center rounded-full p-[10px]">
          <CaretDownIcon open={open} />
        </span>
      </button>
    ) : variant === "compact" ? (
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[27px] shrink-0 items-center rounded-full bg-white py-[2px] pl-[2px] pr-[8px] text-black"
      >
        <span className="flex items-center justify-center rounded-full px-[8px] py-[6px] text-[12px] font-semibold uppercase leading-[0.9] tracking-[0.48px]">
          {locale.toUpperCase()}
        </span>
        <CaretDownIcon open={open} />
      </button>
    ) : (
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center rounded-full bg-white p-[2px] text-black shadow-[inset_0_0_18px_rgba(255,255,255,0.25)] desk:p-[4px]"
      >
        <span className="flex h-[23px] items-center justify-center px-2 text-[12px] font-semibold uppercase leading-[0.9] tracking-[0.48px] desk:h-[32px] desk:w-auto desk:px-[12px] desk:py-[10px] desk:text-[14px] desk:tracking-[0.56px] desk:mix-blend-hard-light">
          <span className="desk:w-[28px] desk:text-center">{locale.toUpperCase()}</span>
        </span>
        <span className="flex items-center justify-center pr-1 desk:size-[32px] desk:p-[10px] desk:pr-[10px]">
          <CaretDownIcon open={open} />
        </span>
      </button>
    );

  return (
    <div ref={rootRef} className="relative z-10 shrink-0">
      {trigger}
      {open ? (
        <ul id={menuId} role="listbox" aria-label={label} className={MENU}>
          {locales.map((code) => {
            const selected = code === locale;
            return (
              <li key={code} role="none">
                <a
                  href={localePath(path, code)} hrefLang={code} lang={code}
                  role="option"
                  aria-selected={selected}
                  onClick={(event) => { event.preventDefault(); choose(code); }}
                  className={`${OPTION} ${
                    variant === "compact"
                      ? "text-[12px] tracking-[0.48px]"
                      : "text-[14px] tracking-[0.56px]"
                  } ${selected ? "bg-black text-white" : "text-black/72 hover:bg-black/5"}`}
                >
                  {nativeLanguageNames[code]}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
