"use client";

import { type ReactNode } from "react";
import { programIcons, programPhotos } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { FigmaImg } from "./FigmaImg";

function QuestionCard({
  children,
  className,
  textClass,
  blob,
}: {
  children: ReactNode;
  className: string;
  textClass: string;
  blob?: ReactNode;
}) {
  return (
    <div
      className={`relative flex h-[254px] items-center justify-center overflow-hidden rounded-[64px] p-6 desk:aspect-square desk:h-auto desk:p-8 ${className}`}
    >
      {blob}
      <p
        className={`relative w-full text-[24px] font-normal leading-none tracking-[-0.96px] desk:w-[252px] desk:tracking-[-1.28px] desk:text-[32px] ${textClass}`}
      >
        {children}
      </p>
    </div>
  );
}

export function ProgramResonate() {
  const copy = useCopy();
  const resonate = copy.programs.resonate;
  return (
    <div className="flex flex-col gap-8">
      <p className="px-6 text-center text-[13.5px] font-semibold uppercase leading-[0.9] tracking-[0.54px] text-black desk:px-0 desk:text-[16px] desk:tracking-[1.28px]">
        {resonate.heading}
      </p>

      <div className="flex flex-col">
        {/* Row 1 */}
        <div className="grid grid-cols-2">
          <div className="relative flex h-[254px] items-center justify-center overflow-hidden rounded-[64px] bg-black p-6 desk:aspect-square desk:h-auto desk:p-8">
            <FigmaImg
              src={programPhotos.earth}
              alt=""
              width={259}
              height={261}
              className="pointer-events-none absolute left-1/2 top-[-166px] h-[261px] w-[259px] -translate-x-1/2 object-bottom"
            />
            <FigmaImg
              src={programPhotos.earth}
              alt=""
              width={259}
              height={261}
              className="pointer-events-none absolute bottom-[-166px] left-1/2 h-[261px] w-[259px] -translate-x-1/2 object-bottom"
            />
            <p className="relative w-full text-[24px] font-normal leading-none tracking-[-0.96px] text-white desk:w-[252px] desk:tracking-[-1.28px] desk:text-[32px]">
              {resonate.age}
            </p>
          </div>

          <QuestionCard
            className="bg-lime"
            textClass="text-black"
            blob={
              <span className="pointer-events-none absolute left-[109px] top-[82px] h-[214.5px] w-[284.68px]">
                <FigmaImg
                  src={programIcons.ellipse19}
                  alt=""
                  width={450}
                  height={380}
                  className="absolute inset-[-38.56%_-29.05%] max-w-none"
                />
              </span>
            }
          >
            {resonate.changemaker.split("\n").map((line, i) => (
              <span key={line}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </QuestionCard>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2">
          <QuestionCard
            className="bg-magenta"
            textClass="text-white"
            blob={
              <span className="pointer-events-none absolute left-[-39px] top-[-101px] h-[258.83px] w-[294px]">
                <FigmaImg
                  src={programIcons.ellipse20}
                  alt=""
                  width={479}
                  height={444}
                  className="absolute inset-[-35.72%_-31.45%] max-w-none"
                />
              </span>
            }
          >
            {resonate.stories}
          </QuestionCard>

          <QuestionCard
            className="bg-orange"
            textClass="text-black"
            blob={
              <span className="pointer-events-none absolute left-[103px] top-[130px] h-[252.5px] w-[286.81px] rotate-180">
                <FigmaImg
                  src={programIcons.ellipse21}
                  alt=""
                  width={467}
                  height={433}
                  className="absolute inset-[-35.72%_-31.45%] max-w-none"
                />
              </span>
            }
          >
            {resonate.indigenous}
          </QuestionCard>
        </div>

        {/* Row 3 — interests card */}
        <div className="relative flex h-[515px] flex-col items-center justify-center gap-6 overflow-hidden rounded-[64px] bg-white p-6 desk:aspect-square desk:h-auto desk:items-start desk:gap-8 desk:p-16">
          <span className="pointer-events-none absolute left-[-32.32px] top-[-392px] h-[633.635px] w-[696.32px]">
            <FigmaImg
              src={programIcons.interestBlob}
              alt=""
              width={1018}
              height={969}
              className="absolute inset-[-26.76%_-21.78%_-26.1%_-24.35%] max-w-none"
            />
          </span>
          <div className="relative flex min-h-px w-[432px] max-w-full flex-1 flex-col justify-center">
            <p className="text-[24px] font-normal leading-none tracking-[-0.96px] text-black desk:tracking-[-1.28px] desk:text-[32px]">
              {resonate.interestsLead}
            </p>
          </div>
          <div className="relative flex w-full flex-col">
            {Array.from({ length: Math.ceil(resonate.interests.length / 3) }, (_, row) => (
              <div
                key={resonate.interests.slice(row * 3, row * 3 + 3).join("-")}
                className="flex h-14 w-full items-center gap-4 desk:gap-8"
              >
                {resonate.interests.slice(row * 3, row * 3 + 3).map((label) => (
                  <p
                    key={label}
                    className="min-w-px flex-1 text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.96px] text-black/80"
                  >
                    {label}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="px-6 text-center text-[24px] font-normal leading-none tracking-[-0.96px] text-black desk:px-0 desk:text-[32px] desk:leading-[1.2] desk:tracking-[-1.28px]">
        {resonate.closing}
      </p>
    </div>
  );
}
