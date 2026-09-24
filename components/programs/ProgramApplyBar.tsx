"use client";

import { useState } from "react";
import { ApplyFlow } from "../apply/ApplyFlow";
import { NominateFlow } from "../nominate/NominateFlow";
import { useLanguage } from "../LanguageProvider";

/** Floating CTA pinned to the bottom of the viewport. */
export function ProgramApplyBar({ mode = "apply" }: { mode?: "apply" | "nominate" }) {
  const { copy } = useLanguage();
  const [open, setOpen] = useState(false);
  const nominate = mode === "nominate";

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-2 desk:p-[10px]">
        <button
          id="apply"
          type="button"
          onClick={() => setOpen(true)}
          className="gradient-brand pointer-events-auto flex w-full max-w-[632px] items-center justify-center rounded-full px-6 py-6 shadow-[0_0_5.45px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.98] desk:h-[80px] desk:px-8 desk:py-0 desk:shadow-[0_8px_28px_rgba(236,38,143,0.35)]"
        >
          <span className="text-[20px] font-medium leading-[0.9] tracking-[-0.8px] text-white desk:font-semibold desk:uppercase desk:tracking-[0.8px]">
            {nominate ? copy.apply.nominate : copy.programs.applyCta}
          </span>
        </button>
      </div>

      {open ? (
        nominate ? (
          <NominateFlow onClose={() => setOpen(false)} />
        ) : (
          <ApplyFlow onClose={() => setOpen(false)} />
        )
      ) : null}
    </>
  );
}
