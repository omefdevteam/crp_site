"use client";

import type { ReactNode } from "react";
import type { LogoFit, ShownLogo, SiteLogos } from "@/lib/logos/model";
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

// How each logo sits in its 88px circle. Built-in art keeps the Figma
// treatment (Sony's mark is framed on black); uploads fit inside a white circle
// so transparent logos stay readable.
const FIT: Readonly<Record<LogoFit, { circle: string; img: string }>> = {
  cover: { circle: "", img: "absolute inset-0 size-full object-cover" },
  framed: { circle: "border border-white bg-black", img: "absolute inset-0 size-full object-contain" },
  inside: { circle: "bg-white", img: "absolute inset-[14%] size-[72%] object-contain" },
};

function Circles({ logos }: { logos: readonly ShownLogo[] }) {
  return (
    <span className="flex shrink-0 items-center">
      {logos.map((logo, i) => {
        const circle = `${CIRCLE} ${i < logos.length - 1 ? "-mr-6 desk:-mr-8" : ""} ${FIT[logo.fit].circle}`;
        const image = <FigmaImg src={logo.src} alt={logo.name} width={88} height={88} className={FIT[logo.fit].img} />;
        return logo.link ? (
          <a key={logo.key} href={logo.link} target="_blank" rel="noopener noreferrer" className={circle}>
            {image}
          </a>
        ) : (
          <span key={logo.key} className={circle}>
            {image}
          </span>
        );
      })}
    </span>
  );
}

// Figma 32:317, one visual per row in order.
const visuals = (logos: SiteLogos): readonly ReactNode[] => [
  <IconChip key="mic" src={programIcons.microphone} fill={MIC_FILL} round />,
  <IconChip key="tree" src={programIcons.treeStructure} fill={TREE_FILL} round={false} />,
  <FigmaImg key="star" src={practice.star} alt="" width={88} height={88} className="size-16 shrink-0 desk:size-[88px]" />,
  <Circles key="partners" logos={logos["programs.partners"]} />,
  <FigmaImg
    key="recruit"
    src={practice.recruit}
    alt=""
    width={91}
    height={88}
    className="h-16 w-[66px] shrink-0 desk:h-[88px] desk:w-[91px]"
  />,
  <Circles key="funders" logos={logos["programs.funders"]} />,
];

/** Partner and funder logos come from Website text → Logos (built-in logos until staff change them).
 * "Ambassadors put their skills into practice through": stacked black rows (Figma 32:316–32:345). */
export function ProgramSkillsPractice({ logos }: { logos: SiteLogos }) {
  const copy = useCopy();
  const row = visuals(logos);
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
            {row[i] ?? null}
          </li>
        ))}
      </ul>
    </section>
  );
}
