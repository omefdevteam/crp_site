"use client";

import { LimeCheck } from "./LimeCheck";

export function FormRadioCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex min-w-0 flex-1 flex-col items-start justify-center gap-2.5 rounded-[28px] px-5 py-4 text-left desk:gap-3 desk:rounded-[32px] desk:p-5 ${
        selected ? "bg-black text-white" : "bg-cream text-black"
      }`}
    >
      <span
        aria-hidden
        className={`grid size-7 shrink-0 place-items-center rounded-full border desk:size-8 ${
          selected ? "border-white bg-black text-lime" : "border-black bg-transparent"
        }`}
      >
        {selected ? <LimeCheck /> : null}
      </span>
      <span className="text-[16px] leading-[1.2] tracking-[-0.64px] desk:text-[18px]">
        {label}
      </span>
    </button>
  );
}
