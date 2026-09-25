"use client";

import { useState } from "react";
import { programIcons } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { ApplicationProcessPopup } from "./ApplicationProcessPopup";
import { FigmaImg } from "./FigmaImg";

export function ProgramApplicationBand() {
  const copy = useCopy();
  const [open, setOpen] = useState(false);

  return (
    <section className="w-full">
      <div className="flex flex-col items-center gap-8 bg-black px-0 py-16 desk:rounded-[105px] desk:px-8 desk:py-[120px]">
        <p className="w-full max-w-[632px] px-6 text-[32px] font-normal leading-none tracking-[-1.28px] text-white desk:px-0">
          {copy.programs.applyBand.body}
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full max-w-[632px] items-center justify-between rounded-[32px] bg-white py-2 pl-6 pr-2 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.98] desk:h-[112px] desk:py-2 desk:pl-8"
        >
          <span className="text-[24px] font-normal leading-none tracking-[-0.96px] text-black desk:text-[32px] desk:tracking-[-1.28px]">
            {copy.programs.applyBand.process}
          </span>
          <span className="flex size-[72px] shrink-0 items-center justify-center rounded-full bg-black desk:size-[96px]">
            <FigmaImg
              src={programIcons.caretDown}
              alt=""
              width={16}
              height={16}
              className="size-[16px] -rotate-90"
            />
          </span>
        </button>
      </div>

      {/* Keyed so each open remounts at step 0 (was a setStep in an effect). */}
      <ApplicationProcessPopup
        key={open ? "open" : "closed"}
        open={open}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
