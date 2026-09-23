"use client";

import { useText } from "@/lib/ui-text";

import type { ReactNode } from "react";

// Feedback toast for the apply form (Figma 2184:1751 / 2184:2083). Error is a
// cream bar with a red warning chip and optional action; success is a black bar
// with a blue check chip.
export function Toast({
  variant,
  children,
  action,
  onClose,
}: {
  variant: "error" | "success";
  children: ReactNode;
  action?: { label: string; onClick: () => void };
  onClose: () => void;
}) {
  const tr = useText();
  const err = variant === "error";
  return (
    <div
      role="status"
      className={`flex w-full max-w-[938px] flex-col gap-4 rounded-[32px] p-6 drop-shadow-[0_4px_16px_rgba(0,0,0,0.12)] desk:flex-row desk:items-center ${
        err ? "border border-[rgba(179,25,66,0.12)] bg-cream" : "bg-black"
      }`}
    >
      <div className="flex flex-1 items-center gap-3">
        <span
          aria-hidden
          className={`grid size-16 shrink-0 place-items-center rounded-[10px] desk:size-20 ${
            err ? "bg-[#fbe0e5]" : "bg-[#26264d]"
          }`}
        >
          {err ? (
            <span className="grid size-6 place-items-center rounded-full bg-[#e4002b] text-[15px] font-bold leading-none text-white">
              !
            </span>
          ) : (
            <span className="grid size-6 place-items-center rounded-full bg-[#3dadff]">
              <svg viewBox="0 0 18 13" className="size-3" fill="none" aria-hidden>
                <path d="M2 7l4.5 4L16 2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </span>
        <div
          className={`flex-1 text-[16px] leading-[1.15] tracking-[-0.8px] desk:text-[20px] ${
            err ? "text-[#5d0d22]" : "text-[#9aa0e8]"
          }`}
        >
          {children}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end desk:self-auto">
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="flex h-14 items-center justify-center rounded-full bg-white px-6 text-[16px] font-semibold uppercase tracking-[0.8px] text-black mix-blend-hard-light desk:h-20 desk:px-8 desk:text-[20px]"
          >
            {action.label}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label={tr("Dismiss")}
          className={`grid size-12 place-items-center rounded-full ${err ? "text-[#5d0d22]" : "text-white"}`}
        >
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
            <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
