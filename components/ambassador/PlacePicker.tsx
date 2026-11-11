"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CountryDropdown } from "@/components/apply/CountryDropdown";
import { field } from "@/components/admin/marks";
import { findCountry, type Country } from "@/lib/countries";
import { useText } from "@/lib/ui-text";

export type PickedPlace = { id: number; name: string; country: string };

// Country, then a city from the GeoNames list. The form posts only the place
// id; the server reads the name and map point back from the list.
export function PlacePicker({
  name,
  label,
  initial,
  initialCountry,
  keepValue,
}: {
  name: string;
  label: string;
  initial: PickedPlace | null;
  /** Preselects a country when no place is saved yet. */
  initialCountry?: string | null;
  /** Posted when the saved place is kept but has no list id. */
  keepValue?: string;
}) {
  const tr = useText();
  const listId = useId();
  const [country, setCountry] = useState<Country | null>(() => {
    const code = initial?.country ?? initialCountry;
    return code ? findCountry(code) ?? null : null;
  });
  const [query, setQuery] = useState(initial?.name ?? "");
  const [picked, setPicked] = useState<PickedPlace | null>(initial);
  const [options, setOptions] = useState<PickedPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current || !country || query.trim().length < 1) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/places?country=${country.code}&q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const data = (await response.json()) as { places?: PickedPlace[] };
        setOptions(data.places ?? []);
        setActive(0);
        setOpen(true);
      } catch {
        // Aborted, or offline: keep the last list.
      }
    }, 150);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [country, query]);

  const choose = (place: PickedPlace) => {
    setPicked(place);
    setQuery(place.name);
    setOpen(false);
    typed.current = false;
  };

  const value = picked ? (picked.id >= 0 ? String(picked.id) : keepValue ?? "") : "";

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <input type="hidden" name={name} value={value} />
      <CountryDropdown
        variant="field"
        label={tr("Country")}
        value={country}
        onChange={(next) => {
          setCountry(next);
          if (picked && picked.country !== next.code) {
            setPicked(null);
            setQuery("");
          }
        }}
      />
      <div className="relative">
        <label className="sr-only" htmlFor={`${listId}-city`}>{tr("City or town")}</label>
        <input
          id={`${listId}-city`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={!country}
          placeholder={country ? tr("Start typing a city or town") : tr("Choose a country first")}
          value={query}
          className={`${field} disabled:opacity-60`}
          onChange={(event) => {
            typed.current = true;
            setQuery(event.target.value);
            setPicked(null);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (!open || options.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(options.length - 1, i + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const option = options[active];
              if (option) choose(option);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {open && options.length > 0 ? (
          <ul id={`${listId}-list`} role="listbox" className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-auto rounded-3xl border border-black/10 bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
            {options.map((option, index) => (
              <li
                key={option.id}
                role="option"
                aria-selected={index === active}
                className={`cursor-pointer rounded-2xl px-4 py-2 text-base ${index === active ? "bg-cream" : ""}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setActive(index)}
              >
                {option.name}
              </li>
            ))}
          </ul>
        ) : null}
        {open && options.length === 0 && query.trim() ? (
          <p className="mt-2 text-sm text-black/60">{tr("No match. Try the nearest larger town.")}</p>
        ) : null}
      </div>
      <p className="text-xs text-black/50">{tr("Place data © GeoNames (CC BY 4.0)")}</p>
    </fieldset>
  );
}
