"use client";

import type { ReactNode } from "react";
import { programIcons, programPhotos } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { FigmaImg } from "./FigmaImg";
import { ProgramSectionHeading } from "./ProgramSectionHeading";

const { practice } = programPhotos;

// Figma 33:662 / 33:663: radial fills from the bottom centre of the 88px chip.
const MIC_FILL = "radial-gradient(100% 100% at 50% 100%, #D2DE38 0%, #E6B633 50%, #FA8D2E 100%)";
const TREE_FILL =
  "radial-gradient(100% 100% at 50% 100%, #D2DE38 0%, #D9B04E 25%, #DF8264 50%, #E65479 75%, #E93D84 87.5%, #EC268F 100%)";

const CHIP = "flex size-16 shrink-0 items-center justify-center desk:size-[88px]";
const CIRCLE = "relative size-16 shrink-0 overflow-hidden rounded-full desk:size-[88px]";

function IconChip({ src, fill, round }: { src: string; fill: string; round: boolean }) {
  return (
    <span className={`${CHIP} ${round ? "rounded-full" : "rounded-[18px] desk:rounded-[24px]"}`} style={{ backgroundImage: fill }}>
      <FigmaImg src={src} alt="" width={24} height={24} className="size-5 desk:size-6" />
    </span>
  );
}

function Circles({ srcs, framedFirst = false }: { srcs: readonly string[]; framedFirst?: boolean }) {
  return (
    <span className="flex shrink-0 items-center">
      {srcs.map((src, i) => (
        <span
          key={src}
          className={`${CIRCLE} ${i < srcs.length - 1 ? "-mr-6 desk:-mr-8" : ""} ${framedFirst && i === 0 ? "border border-white bg-black" : ""}`}
        >
          <FigmaImg
            src={src}
            alt=""
            width={88}
            height={88}
            className={`absolute inset-0 size-full ${framedFirst && i === 0 ? "object-contain" : "object-cover"}`}
          />
        </span>
      ))}
    </span>
  );
}

// Figma 32:317, one visual per row in order.
const VISUALS: readonly ReactNode[] = [
  <IconChip key="mic" src={programIcons.microphone} fill={MIC_FILL} round />,
  <IconChip key="tree" src={programIcons.treeStructure} fill={TREE_FILL} round={false} />,
  <FigmaImg key="star" src={practice.star} alt="" width={88} height={88} className="size-16 shrink-0 desk:size-[88px]" />,
  <Circles key="partners" srcs={practice.partners} />,
  <FigmaImg
    key="recruit"
    src={practice.recruit}
    alt=""
    width={91}
    height={88}
    className="h-16 w-[66px] shrink-0 desk:h-[88px] desk:w-[91px]"
  />,
  <Circles key="funders" srcs={practice.funders} framedFirst />,
];

/** "Ambassadors put their skills into practice through": stacked black rows (Figma 32:316–32:345). */
export function ProgramSkillsPractice() {
  const copy = useCopy();
  const { heading, items } = copy.programs.practice;

  return (
    <section className="flex flex-col gap-8">
      <ProgramSectionHeading>{heading}</ProgramSectionHeading>
      <ul className="flex flex-col">
        {items.map((item, i) => (
          <li
            key={item}
            className="flex h-[120px] items-center gap-3 overflow-clip rounded-[32px] bg-black px-6 py-3 desk:h-[160px] desk:px-8"
          >
            <p className="min-w-0 flex-1 text-[13.5px] font-semibold uppercase leading-[0.9] tracking-[1.08px] text-white desk:text-[16px] desk:tracking-[1.28px]">
              {item}
            </p>
            {VISUALS[i] ?? null}
          </li>
        ))}
      </ul>
    </section>
  );
}
