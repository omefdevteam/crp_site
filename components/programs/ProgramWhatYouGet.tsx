"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { programIcons, programPhotos } from "@/lib/program-assets";
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
}: {
  y: MotionValue<number>;
  reduceMotion: boolean;
  cardIndex: number;
}) {
  // Same stack in every card, shifted up by N card-heights so the windows align.
  // % top is relative to this card's height (= one aspect-square step).
  const base = reduceMotion ? STACK_TOP : STACK_TOP - BUFFER_TOP.height;
  const top = `calc(${base}px - ${cardIndex * 100}%)`;

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

function Badge({ iconSrc, label }: { iconSrc: string; label: string }) {
  return (
    <div className="inline-flex w-fit items-center gap-[7px] rounded-full bg-white py-[5px] pl-[7px] pr-[10px] desk:gap-3 desk:py-[8px] desk:pl-[12px] desk:pr-[16px]">
      <FigmaImg src={iconSrc} alt="" width={16} height={16} className="size-4 shrink-0 desk:size-8" />
      <span className="whitespace-nowrap text-[12px] font-semibold uppercase leading-[0.9] tracking-[0.48px] text-black desk:text-[16px] desk:tracking-[1.28px]">
        {label}
      </span>
    </div>
  );
}

type Card = {
  title?: string;
  image?: string;
  badge?: { iconSrc: string; label: string };
  description: string;
  cardClass: string;
  titleClass: string;
  descriptionClass: string;
};

const CARDS: Card[] = [
  {
    title: "4 week",
    badge: { iconSrc: programIcons.laptop, label: "Online" },
    description: "",
    cardClass: "bg-black",
    titleClass: "text-white",
    descriptionClass: "text-white",
  },
  {
    title: "1 week in Antalya",
    badge: { iconSrc: programIcons.airplaneTakeoff, label: "Travel" },
    description: "",
    cardClass: "bg-magenta",
    titleClass: "text-white",
    descriptionClass: "text-black",
  },
  {
    image: programPhotos.accreditation,
    description: "",
    cardClass: "bg-lime",
    titleClass: "text-black",
    descriptionClass: "text-black",
  },
  {
    title: "Mentorship",
    description: "",
    cardClass: "bg-orange",
    titleClass: "text-white",
    descriptionClass: "text-black",
  },
  {
    title: "Post-\nCOP",
    description: "",
    cardClass: "bg-white",
    titleClass: "text-black",
    descriptionClass: "text-black",
  },
];

function WhatYouGetCard({
  card,
  y,
  reduceMotion,
  cardIndex,
}: {
  card: Card;
  y: MotionValue<number>;
  reduceMotion: boolean;
  cardIndex: number;
}) {
  // overflow-hidden + radius clips the shared stack to this card's corners;
  // the same parallax y in every card keeps tiles continuous across seams.
  return (
    <div
      className={`relative flex aspect-square overflow-hidden rounded-[88px] p-10 desk:rounded-[105px] desk:p-12 ${card.cardClass}`}
    >
      <Collage y={y} reduceMotion={reduceMotion} cardIndex={cardIndex} />
      <div className="relative z-10 flex h-full flex-1 flex-col justify-between">
        <div className="flex flex-col gap-6 desk:gap-12">
          {card.title ? (
            <h3
              className={`max-w-[calc(100%-160px)] text-[48px] font-normal leading-[0.8] tracking-[-1.92px] desk:max-w-full desk:text-[96px] desk:tracking-[-3.84px] ${card.titleClass}`}
            >
              {card.title.split("\n").map((line, i) => (
                <span key={line}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h3>
          ) : null}
          {card.image ? (
            <div className="h-[140px] w-[120px] overflow-hidden rounded-[500px] bg-white desk:h-[219px] desk:w-[195px]">
              <FigmaImg
                src={card.image}
                alt=""
                width={195}
                height={219}
                className="size-full object-cover"
              />
            </div>
          ) : null}
          {card.badge ? <Badge iconSrc={card.badge.iconSrc} label={card.badge.label} /> : null}
        </div>
        <p
          className={`max-w-[149px] text-[15px] font-normal leading-[1.2] tracking-[-0.6px] desk:max-w-[241px] desk:text-[20px] desk:tracking-[-0.8px] ${card.descriptionClass}`}
        >
          {card.description}
        </p>
      </div>
    </div>
  );
}

export function ProgramWhatYouGet() {
  const copy = useCopy();
  const cardsCopy = copy.programs.whatYouGet.cards;
  const stackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() === true;

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
              key={text.title || text.description}
              y={y}
              reduceMotion={reduceMotion}
              cardIndex={i}
              card={{
                ...card,
                title: text.title || undefined,
                badge:
                  card.badge && text.badge
                    ? { ...card.badge, label: text.badge }
                    : undefined,
                description: text.description,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
