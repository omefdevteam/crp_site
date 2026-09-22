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
      <div className="flex flex-col items-center gap-8 rounded-[56px] bg-black px-8 py-20 desk:rounded-[105px] desk:py-[120px]">
        <p className="w-full max-w-[632px] text-[24px] font-normal leading-none tracking-[-1.28px] text-white desk:text-[32px]">
          {copy.programs.applyBand.body}
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-[112px] w-full max-w-[632px] items-center justify-between rounded-[32px] bg-white py-[8px] pl-8 pr-[8px]"
        >
          <span className="text-[24px] font-normal leading-none tracking-[-1.28px] text-black desk:text-[32px]">
            {copy.programs.applyBand.process}
          </span>
          <span className="flex size-[96px] shrink-0 items-center justify-center rounded-full bg-black">
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
