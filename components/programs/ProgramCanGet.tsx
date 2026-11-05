"use client";

import { programPhotos } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { FigmaImg } from "./FigmaImg";
import { ProgramSectionHeading } from "./ProgramSectionHeading";

const { canGet } = programPhotos;

type Art = {
  src: string;
  /** Rotated box, placed like Figma's outer flex wrapper (px from the card's top left). */
  box: { left: number; top: number; width: number; height: number };
  rotate: number;
  /** The image's own frame before rotation. */
  frame: { width: number; height: number };
  /** Image crop inside the frame (Figma's % insets), or cover when omitted. */
  crop?: string;
  /** Network and Access clip their art to the card in Figma; the rest spill over it. */
  clip?: boolean;
};

// Figma 32:295, cards in reading order (2 per row).
const ART: readonly Art[] = [
  {
    src: canGet.knowledge,
    box: { left: -52.77, top: -49.59, width: 264.535, height: 253.188 },
    rotate: 30,
    frame: { width: 205, height: 174 },
    crop: "h-[131.92%] left-[-25.26%] top-[-15.38%] w-[154.11%]",
  },
  {
    src: canGet.network,
    box: { left: -19, top: -123, width: 417.96, height: 400.365 },
    rotate: 38.84,
    frame: { width: 349, height: 233 },
    clip: true,
  },
  {
    src: canGet.skills,
    box: { left: 0, top: -25, width: 160, height: 183 },
    rotate: -90,
    frame: { width: 183, height: 160 },
    crop: "h-[119.47%] left-[-44.02%] top-[0.07%] w-[156.29%]",
  },
  {
    src: canGet.recognition,
    box: { left: 32.6, top: -62.94, width: 386.79, height: 340.883 },
    rotate: 27.67,
    frame: { width: 324, height: 215 },
  },
  {
    src: canGet.access,
    box: { left: -55, top: -43, width: 297.987, height: 236.129 },
    rotate: -60,
    frame: { width: 111, height: 280 },
    crop: "left-0 top-0 size-full",
    clip: true,
  },
  {
    src: canGet.advancement,
    box: { left: 113.13, top: -40.4, width: 242.126, height: 224.241 },
    rotate: 30,
    frame: { width: 195.133, height: 146.271 },
    crop: "h-[99.78%] left-0 top-[0.22%] w-full",
  },
];

function CardArt({ art }: { art: Art }) {
  return (
    // Phones: the 316px desktop card is about 0.6 as wide, so the art scales with it.
    <div className="pointer-events-none absolute left-0 top-0 origin-top-left scale-[0.6] desk:scale-100" aria-hidden>
      <div
        className="absolute flex items-center justify-center"
        style={{ left: art.box.left, top: art.box.top, width: art.box.width, height: art.box.height }}
      >
        <div className="flex-none" style={{ transform: `rotate(${art.rotate}deg)` }}>
          <div className="relative overflow-hidden" style={{ width: art.frame.width, height: art.frame.height }}>
            <FigmaImg
              src={art.src}
              alt=""
              width={Math.round(art.frame.width)}
              height={Math.round(art.frame.height)}
              className={art.crop ? `absolute max-w-none ${art.crop}` : "absolute inset-0 size-full max-w-none object-cover"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** "Ambassadors can get": six white cards, 2 per row, each with a cut-out photo (Figma 32:295). */
export function ProgramCanGet() {
  const copy = useCopy();
  const { heading, items } = copy.programs.canGet;

  return (
    <section className="flex flex-col gap-8">
      <ProgramSectionHeading>{heading}</ProgramSectionHeading>
      {/* Spilled art stops at the grid's sides (the page frame in Figma) so it never widens the page. */}
      <div className="grid grid-cols-2 overflow-x-clip">
        {items.map((item, i) => {
          const art = ART[i];
          return (
            <div
              key={item.label}
              className={`relative flex h-[220px] min-w-0 flex-col justify-end gap-2 rounded-[40px] bg-white p-5 desk:h-[316px] desk:rounded-[64px] desk:p-8 ${art?.clip ? "overflow-clip" : ""}`}
            >
              {art ? <CardArt art={art} /> : null}
              <p className="relative text-[12px] font-semibold uppercase leading-[0.9] tracking-[0.96px] text-black [overflow-wrap:anywhere] desk:text-[16px] desk:tracking-[1.28px]">
                {item.label}
              </p>
              <p className="relative text-[20px] font-normal leading-[1.2] tracking-[-0.8px] text-black desk:text-[32px] desk:tracking-[-1.28px]">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
