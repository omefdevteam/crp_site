"use client";

import { useState } from "react";
import { programIcons } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { AboutProgramPopup } from "./AboutProgramPopup";
import { FigmaImg } from "./FigmaImg";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-h-[143px] flex-1 flex-col justify-between rounded-[32px] bg-white p-6">
      <p className="text-[32px] font-normal leading-[1.2] tracking-[-1.28px] text-black">
        {value}
      </p>
      <p className="mt-4 text-[16px] font-semibold uppercase leading-none tracking-[1.28px] text-black/48">
        {label}
      </p>
    </div>
  );
}

export function ProgramAbout() {
  const copy = useCopy();
  const about = copy.programs.about;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      {/* Date + location pills */}
      <div className="flex h-[112px] items-stretch gap-0">
        <div className="relative z-10 flex w-max shrink-0 items-center gap-3 rounded-[32px] bg-black px-8">
          <FigmaImg
            src={programIcons.calendarBlank}
            alt=""
            width={32}
            height={32}
            className="size-[32px] shrink-0"
          />
          <span className="whitespace-nowrap text-[16px] font-semibold uppercase leading-[0.9] tracking-[1.28px] text-white">
            {about.dates}
          </span>
        </div>
        <div className="-ml-[32px] flex min-w-0 flex-1 items-center gap-3 rounded-[32px] bg-black py-0 pl-[64px] pr-8">
          <FigmaImg
            src={programIcons.turkeyFlag}
            alt=""
            width={48}
            height={32}
            className="h-[32px] w-[48px] shrink-0"
          />
          <span className="text-[16px] font-semibold uppercase leading-[1.2] tracking-[1.28px] text-white">
            {about.location}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <p className="text-[28px] font-normal leading-[1.2] tracking-[-1.28px] text-black desk:text-[32px]">
          {about.lede}
        </p>
        <div className="flex flex-col gap-3 text-[18px] font-normal leading-[1.2] tracking-[-0.8px] text-black/84 desk:text-[20px]">
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
        className="flex h-[112px] w-full items-center justify-between rounded-[32px] bg-white py-[8px] pl-8 pr-[8px] text-left"
      >
        <span className="text-[28px] font-normal leading-none tracking-[-1.28px] text-black desk:text-[32px]">
          {about.accordion}
        </span>
        <span className="flex size-[96px] shrink-0 items-center justify-center rounded-full bg-black">
          <FigmaImg
            src={programIcons.questionMark}
            alt=""
            width={24}
            height={24}
            className="size-[24px]"
          />
        </span>
      </button>

      {/* Stats */}
      <div className="flex items-stretch">
        <StatCard value={about.stats[0].value} label={about.stats[0].label} />
        <div className="w-4 shrink-0" />
        <StatCard value={about.stats[1].value} label={about.stats[1].label} />
        <div className="w-4 shrink-0" />
        <StatCard value={about.stats[2].value} label={about.stats[2].label} />
      </div>

      {/* Timeline bar: 3 black segments (online) + 1 orange segment (Antalya) */}
      <div className="relative isolate flex h-[173px] items-stretch">
        <div className="relative z-[4] min-w-px flex-1 rounded-[24px] bg-black" />
        <div className="relative z-[3] min-w-px flex-1 rounded-[24px] bg-black" />
        <div className="relative z-[2] min-w-px flex-1 rounded-[24px] bg-black" />
        <div className="relative z-[1] min-w-px flex-1 overflow-hidden rounded-[24px] bg-orange">
          <span className="absolute left-[33.33px] top-[94px] h-[138.5px] w-[183.814px]">
            <FigmaImg
              src={programIcons.ellipse18}
              alt=""
              width={291}
              height={245}
              className="absolute -left-[29.05%] -top-[38.56%] h-[177.12%] w-[158.1%] max-w-none"
            />
          </span>
          <span className="absolute -left-[125.67px] -top-[90px] h-[149.5px] w-[169.814px]">
            <FigmaImg
              src={programIcons.ellipse17}
              alt=""
              width={277}
              height={256}
              className="absolute -left-[31.45%] -top-[35.72%] h-[171.44%] w-[162.9%] max-w-none"
            />
          </span>
        </div>

        <p className="pointer-events-none absolute left-[calc(50%-80px)] top-1/2 z-10 w-[230px] -translate-x-1/2 -translate-y-1/2 text-center text-[16px] font-semibold uppercase leading-[0.9] tracking-[1.28px] text-white">
          <span className="mb-3 block">{about.online}</span>
          {about.onlineDates}
        </p>
        <p className="pointer-events-none absolute right-[79px] top-1/2 z-10 w-[126px] translate-x-1/2 -translate-y-1/2 text-center text-[16px] font-semibold uppercase leading-[0.9] tracking-[1.28px] text-white">
          <span className="mb-3 block">{about.antalya}</span>
          {about.antalyaDates}
        </p>
      </div>

      <AboutProgramPopup open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
