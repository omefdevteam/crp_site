"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRIES, type Country } from "@/lib/countries";
import { FIELD, LABEL } from "./fieldStyles";

function Caret() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 text-black/48" fill="none" aria-hidden>
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The country picker matching Figma 2184:2516: a rounded white panel of flag +
// name rows, with a cream highlight on the selected row. "field" is the
// full-width pill (nationality / based-in); "inline" is the compact trigger
// embedded in the phone field (shows the dial code).
export function CountryDropdown({
  variant,
  label,
  value,
  onChange,
}: {
  variant: "field" | "inline";
  label?: string;
  value: Country | null;
  onChange: (c: Country) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node)) return;
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative ${variant === "field" ? "flex-1" : ""}`}>
      {variant === "field" ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`${FIELD} w-full gap-4 pl-5 pr-6`}
        >
          {value ? (
            <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="text-[20px] leading-none">{value.flag}</span>
              <span className="truncate text-[16px] text-black">{value.name}</span>
            </span>
          ) : (
            <span className={`flex-1 text-left ${LABEL}`}>{label}</span>
          )}
          <Caret />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Country code"
          className="flex h-11 items-center gap-2 border-r border-black/8 pr-2"
        >
          <span className="text-[18px] leading-none">{value?.flag ?? "🌍"}</span>
          <span className="text-[14px] font-semibold text-black/60">{value?.dial ?? "+"}</span>
          <Caret />
        </button>
      )}

      {open ? (
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-50 max-h-[319px] overflow-y-auto rounded-[24px] border border-black/12 bg-white px-[18px] py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.12)] ${variant === "field" ? "w-full min-w-[260px]" : "w-[280px]"}`}
        >
          {COUNTRIES.map((c) => {
            const selected = value?.name === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={`flex h-14 w-full items-center gap-3 rounded-[18px] text-left ${selected ? "-mx-3 bg-[rgba(244,241,234,0.64)] px-3" : ""}`}
              >
                <span className="text-[20px] leading-none">{c.flag}</span>
                <span className="flex-1 truncate text-[20px] leading-[1.2] tracking-[-0.8px] text-black">
                  {c.name}
                </span>
                {variant === "inline" ? (
                  <span className="text-[16px] text-black/48">{c.dial}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
