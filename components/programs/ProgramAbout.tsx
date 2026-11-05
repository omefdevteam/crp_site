"use client";

import { useState } from "react";
import type { SiteLogos } from "@/lib/logos/model";
import { programIcons } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { AboutProgramPopup } from "./AboutProgramPopup";
import { FigmaImg } from "./FigmaImg";
import { ProgramCanGet } from "./ProgramCanGet";
import { ProgramSkillsPractice } from "./ProgramSkillsPractice";

export function ProgramAbout({ logos }: { logos: SiteLogos }) {
  const copy = useCopy();
  const about = copy.programs.about;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      {/* Date + location pills (Figma 32:276): the dates pill hugs its text, location fills the rest. */}
      <div className="flex items-stretch desk:h-[112px]">
        <div className="flex shrink-0 items-center gap-3 rounded-[32px] bg-black px-6 py-8 desk:p-8">
          <FigmaImg
            src={programIcons.calendarBlank}
            alt=""
            width={32}
            height={32}
            className="size-[32px] shrink-0"
          />
          <span className="whitespace-nowrap text-[14px] font-semibold uppercase leading-[0.9] tracking-[1.12px] text-white desk:text-[16px] desk:tracking-[1.28px]">
            {about.dates}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center rounded-[32px] bg-black px-6 py-8 desk:p-8">
          <span className="min-w-0 flex-1 text-[14px] font-semibold uppercase leading-[1.2] tracking-[1.12px] text-white desk:text-[16px] desk:tracking-[1.28px]">
            {about.location}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[17px] px-6 desk:gap-6 desk:px-0">
        <p className="text-[32px] font-normal leading-none tracking-[-1.28px] text-black desk:leading-[1.2]">
          {about.lede}
        </p>
        <div className="flex flex-col gap-3 text-[15px] font-normal leading-[1.2] tracking-[-0.6px] text-black/84 desk:text-[20px] desk:tracking-[-0.8px]">
          {about.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* About the program — opens side popup */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={copy.a11y.toggleAbout}
        className="flex w-full items-center justify-between rounded-[32px] bg-white py-2 pl-6 pr-2 text-left transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.98] desk:h-[112px] desk:py-2 desk:pl-8"
      >
        <span className="text-[24px] font-normal leading-none tracking-[-0.96px] text-black desk:text-[32px] desk:tracking-[-1.28px]">
          {about.accordion}
        </span>
        <span className="flex size-[72px] shrink-0 items-center justify-center rounded-full bg-black desk:size-[96px]">
          <FigmaImg
            src={programIcons.questionMark}
            alt=""
            width={16}
            height={16}
            className="size-[16px] desk:size-[24px]"
          />
        </span>
      </button>

      <ProgramCanGet />
      <ProgramSkillsPractice logos={logos} />

      <AboutProgramPopup open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
