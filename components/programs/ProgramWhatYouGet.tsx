"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { programPhotos } from "@/lib/program-assets";
import { fitVars } from "@/lib/fitSize";
import { useFitText } from "@/lib/useFitText";
import { useCopy } from "../LanguageProvider";
import { FigmaImg } from "./FigmaImg";

const PARALLAX_PX = 80;
// Align to the top of the first card; buffers + clip keep parallax inside the column.
const STACK_TOP = 0;
const SHORT = { height: 244, radius: "rounded-[54px]" } as const;
const TALL = { height: 384, radius: "rounded-[40px]" } as const;

type Tile = {
  src: string;
  overlay?: string;
  height: number;
  radius: string;
};

const { collage } = programPhotos;
// Top → bottom, matching Figma node 2151:2520 ("Images on the right").
const STACK: readonly Tile[] = [
  { ...SHORT, src: collage.a0617 }, // laptop on grass
  { ...TALL, src: collage.a0420 }, // overhead walking
  { ...SHORT, src: collage.a0619, overlay: collage.a0421 }, // coastal landscape
  { ...SHORT, src: collage.a0417 }, // columns
  { ...TALL, src: collage.a0618 }, // group selfie
  { ...SHORT, src: collage.a0619, overlay: collage.a0620 }, // outdoor table
  { ...SHORT, src: collage.a0614 }, // man in blue shirt
  { ...TALL, src: collage.a0615 }, // kitchen conversation
  { ...SHORT, src: collage.a0616 }, // patio conversation
  { ...TALL, src: collage.a0419 }, // fruit picking
  { ...SHORT, src: collage.a0418 }, // podium
];
// Duplicate end tiles so ±PARALLAX_PX never exposes the cards behind the stack.
const BUFFER_TOP = STACK[0];
const BUFFER_BOTTOM = STACK[STACK.length - 1];

function CollageTile({ tile }: { tile: Tile }) {
  return (
    <div
      className={`relative w-full shrink-0 overflow-hidden bg-white ${tile.radius}`}
      style={{ height: tile.height }}
    >
      <FigmaImg
        src={tile.src}
        alt=""
        width={290}
        height={tile.height}
        className="absolute inset-0 size-full object-cover"
      />
      {tile.overlay ? (
        <FigmaImg
          src={tile.overlay}
          alt=""
          width={290}
          height={tile.height}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </div>
  );
}

function Collage({
  y,
  reduceMotion,
  cardIndex,
  offset,
}: {
  y: MotionValue<number>;
  reduceMotion: boolean;
  cardIndex: number;
  /** Measured height of the cards above, once known (a long translation can make a card taller). */
  offset?: number;
}) {
  // Same stack in every card, shifted up by the cards above so the windows align.
  // Before measuring, % top is relative to this card's height (= one square step).
  const base = reduceMotion ? STACK_TOP : STACK_TOP - BUFFER_TOP.height;
  const top =
    offset === undefined ? `calc(${base}px - ${cardIndex * 100}%)` : `${base - offset}px`;

  return (
    <motion.div
      className="pointer-events-none absolute right-0 flex w-[180px] flex-col desk:w-[290px]"
      style={reduceMotion ? { top } : { top, y }}
    >
      {reduceMotion ? null : <CollageTile tile={BUFFER_TOP} />}
      {STACK.map((tile, i) => (
        <CollageTile key={i} tile={tile} />
      ))}
      {reduceMotion ? null : <CollageTile tile={BUFFER_BOTTOM} />}
    </motion.div>
  );
}

type Card = {
  title: string;
  /** One paragraph (or how-it-works step) per line. */
  description: string;
  cardClass: string;
  titleClass: string;
  descriptionClass: string;
  /** How-it-works steps sit further apart than paragraphs (Figma 35:776). */
  steps?: boolean;
};

// Titles overlap the photo column by design (Figma 32:424–32:483); on narrow
// cards a long word shrinks to the card's width instead of overflowing it.
const FIT_TITLE =
  "supports-[width:1cqw]:fit-text [--fit-max:48px] [--fit-room:100cqw] [--fit-track-em:-0.04] desk:[--fit-max:96px]";

type Style = Omit<Card, "title" | "description">;

// Figma 32:259 "You will be part of building", top to bottom.
const CARDS: readonly Style[] = [
  { cardClass: "bg-black", titleClass: "text-white", descriptionClass: "text-white" },
  { cardClass: "bg-magenta", titleClass: "text-white", descriptionClass: "text-black" },
  { cardClass: "bg-lime", titleClass: "text-white", descriptionClass: "text-black" },
  { cardClass: "bg-orange", titleClass: "text-white", descriptionClass: "text-black", steps: true },
  { cardClass: "bg-white", titleClass: "text-black", descriptionClass: "text-black" },
];

function WhatYouGetCard({
  card,
  y,
  reduceMotion,
  cardIndex,
  offset,
}: {
  card: Card;
  y: MotionValue<number>;
  reduceMotion: boolean;
  cardIndex: number;
  offset?: number;
}) {
  // overflow-hidden + radius clips the shared stack to this card's corners;
  // the same parallax y in every card keeps tiles continuous across seams.
  // Square by default (the before: spacer is as tall as the content box is wide),
  // but taller when the text needs it, so a long translation is never cut off.
  const titleRef = useFitText<HTMLHeadingElement>(card.title);
  const lines = card.description.split("\n").filter(Boolean);
  return (
    <div
      className={`@container relative grid overflow-hidden rounded-[88px] p-10 before:col-start-1 before:row-start-1 before:pt-[100%] before:content-[''] desk:rounded-[105px] desk:p-12 ${card.cardClass}`}
    >
      <Collage y={y} reduceMotion={reduceMotion} cardIndex={cardIndex} offset={offset} />
      <div className="relative z-10 col-start-1 row-start-1 flex flex-col justify-between gap-6">
        <h3
          ref={titleRef}
          className={`${FIT_TITLE} text-[48px] font-normal leading-[0.8] tracking-[-1.92px] desk:text-[96px] desk:tracking-[-3.84px] ${card.titleClass}`}
          style={fitVars(card.title, "outfit")}
        >
          {card.title}
        </h3>
        <div
          className={`flex max-w-[149px] flex-col text-[15px] font-normal leading-[1.2] tracking-[-0.6px] desk:max-w-[241px] desk:text-[20px] desk:tracking-[-0.8px] ${card.steps ? "gap-4 desk:gap-6" : "gap-2 desk:gap-3"} ${card.descriptionClass}`}
        >
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProgramWhatYouGet() {
  const copy = useCopy();
  const cardsCopy = copy.programs.whatYouGet.cards;
  const stackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() === true;
  const [offsets, setOffsets] = useState<number[] | null>(null);

  useLayoutEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;
    const cards = [...stack.children] as HTMLElement[];
    const measure = () => {
      let sum = 0;
      const next = cards.map((card) => {
        const above = sum;
        sum += card.offsetHeight;
        return above;
      });
      setOffsets((prev) => (prev && prev.every((v, i) => v === next[i]) ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start end", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });
  const y = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [PARALLAX_PX, -PARALLAX_PX],
  );

  return (
    <div className="flex flex-col gap-8">
      <p className="px-6 text-center text-[13.5px] font-semibold uppercase leading-[0.9] tracking-[0.54px] text-black desk:px-0 desk:text-[16px] desk:tracking-[1.28px]">
        {copy.programs.whatYouGet.heading}
      </p>
      <div ref={stackRef} className="relative flex flex-col">
        {CARDS.map((card, i) => {
          const text = cardsCopy[i];
          return (
            <WhatYouGetCard
              key={text.title}
              y={y}
              reduceMotion={reduceMotion}
              cardIndex={i}
              offset={offsets?.[i]}
              card={{ ...card, title: text.title, description: text.description }}
            />
          );
        })}
      </div>
    </div>
  );
}
