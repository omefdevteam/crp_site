"use client";

import { useText } from "@/lib/ui-text";

import { type KeyboardEvent, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../LanguageProvider";
import { COUNTRIES, countryLabel, rankCountries, type Country } from "@/lib/countries";
import { FIELD, LABEL } from "./fieldStyles";

function Caret() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 text-black/48" fill="none" aria-hidden>
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Flag({ code, lazy = false }: { code: string; lazy?: boolean }) {
  return (
    <span className="inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-[3px] bg-black/5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/flags/${code.toLowerCase()}.svg`}
        alt=""
        width={24}
        height={16}
        draggable={false}
        loading={lazy ? "lazy" : "eager"}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

function placeMenu(anchor: HTMLButtonElement, variant: "field" | "inline") {
  const rect = anchor.getBoundingClientRect();
  const width = variant === "field" ? Math.max(rect.width, 280) : 320;
  const gap = 8;
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(180, Math.min(360, openUp ? spaceAbove : spaceBelow));
  const top = openUp ? Math.max(8, rect.top - gap - maxHeight) : rect.bottom + gap;
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
  return { top, left, width, maxHeight };
}

// Rounded flag + name rows. "field" is the nationality / based-in pill.
// "inline" is the phone dial control. Typing ranks matches to the top.
export function CountryDropdown({
  variant,
  label,
  value,
  onChange,
}: {
  variant: "field" | "inline";
  label?: string;
  value: Country | null;
  onChange: (country: Country) => void;
}) {
  const tr = useText();
  const { locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [menuStyle, setMenuStyle] = useState<ReturnType<typeof placeMenu> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const focusedSearch = useRef(false);
  const listId = useId();

  const ranked = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      names = null;
    }
    const labelFor = (country: Country) => {
      const localized = names?.of(country.code);
      return localized && localized !== country.code ? localized : country.name;
    };
    return rankCountries(COUNTRIES, query, labelFor).map((country) => ({
      country,
      label: labelFor(country),
    }));
  }, [locale, query]);
  const safeActive = ranked.length === 0 ? 0 : Math.min(active, ranked.length - 1);

  useLayoutEffect(() => {
    const anchor = triggerRef.current;
    if (!open || !anchor) return;
    const place = () => {
      const next = placeMenu(anchor, variant);
      setMenuStyle((current) =>
        current &&
        current.top === next.top &&
        current.left === next.left &&
        current.width === next.width &&
        current.maxHeight === next.maxHeight
          ? current
          : next,
      );
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, variant]);

  useEffect(() => {
    if (!open) {
      focusedSearch.current = false;
      return;
    }
    if (!menuStyle || focusedSearch.current) return;
    searchRef.current?.focus({ preventScroll: true });
    focusedSearch.current = true;
  }, [open, menuStyle]);

  useEffect(() => {
    if (!open || !menuStyle) return;
    const list = listRef.current;
    if (!list) return;
    const target = list.querySelector<HTMLElement>(query ? "[data-active='true']" : "[data-selected='true'], [data-active='true']");
    if (!target) return;
    const option = target.getBoundingClientRect();
    const frame = list.getBoundingClientRect();
    if (option.top < frame.top) list.scrollTop -= frame.top - option.top;
    else if (option.bottom > frame.bottom) list.scrollTop += option.bottom - frame.bottom;
  }, [open, menuStyle, query, safeActive]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (wrapRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(country: Country) {
    onChange(country);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setQuery("");
      setActive(0);
      setOpen(true);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      setQuery(event.key);
      setActive(0);
      setOpen(true);
    }
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, ranked.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(Math.max(ranked.length - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const country = ranked[safeActive]?.country;
      if (country) choose(country);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  const shownLabel = value ? countryLabel(value, locale) : label;

  return (
    <div ref={wrapRef} className={variant === "field" ? "relative flex-1" : "relative"}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setQuery("");
          setActive(0);
          setOpen((current) => !current);
        }}
        onKeyDown={onTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={variant === "inline" ? tr("Country code") : undefined}
        className={
          variant === "field"
            ? `${FIELD} w-full gap-4 pl-5 pr-6`
            : "flex h-11 items-center gap-2 border-r border-black/8 pr-2"
        }
      >
        {variant === "field" ? (
          value ? (
            <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <Flag code={value.code} />
              <span className="truncate text-[16px] text-black">{shownLabel}</span>
            </span>
          ) : (
            <span className={`flex-1 text-left ${LABEL}`}>{label}</span>
          )
        ) : (
          <>
            {value ? <Flag code={value.code} /> : <span className="inline-block h-4 w-6 rounded-[3px] bg-black/5" />}
            <span className="text-[14px] font-semibold text-black/60">{value?.dial ?? "+"}</span>
          </>
        )}
        <Caret />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width, maxHeight: menuStyle.maxHeight }}
              className="fixed z-[80] flex flex-col overflow-hidden rounded-[24px] border border-black/12 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
            >
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder={tr("Search country")}
                aria-label={tr("Search country")}
                aria-controls={listId}
                aria-activedescendant={ranked[safeActive] ? `${listId}-${ranked[safeActive].country.code}` : undefined}
                aria-autocomplete="list"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="shrink-0 border-b border-black/8 px-[18px] py-3 text-[16px] text-black outline-none placeholder:text-black/40"
              />
              <div ref={listRef} id={listId} role="listbox" className="overflow-y-auto px-2 py-1.5">
                {ranked.length === 0 ? (
                  <p className="px-3 py-4 text-[14px] text-black/48">{tr("No countries found")}</p>
                ) : (
                  ranked.map(({ country, label: countryName }, index) => {
                    const selected = value?.code === country.code;
                    const current = index === safeActive;
                    return (
                      <button
                        key={country.code}
                        id={`${listId}-${country.code}`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-active={current ? "true" : undefined}
                        data-selected={selected ? "true" : undefined}
                        onMouseMove={() => {
                          if (index !== safeActive) setActive(index);
                        }}
                        onClick={() => choose(country)}
                        className={`flex h-14 w-full items-center gap-3 rounded-[18px] px-3 text-left ${selected || current ? "bg-[rgba(244,241,234,0.9)]" : ""}`}
                      >
                        <Flag code={country.code} lazy />
                        <span className="min-w-0 flex-1 truncate text-[20px] leading-[1.2] tracking-[-0.8px] text-black">
                          {countryName}
                        </span>
                        {variant === "inline" ? (
                          <span className="shrink-0 text-[16px] text-black/48">{country.dial}</span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
