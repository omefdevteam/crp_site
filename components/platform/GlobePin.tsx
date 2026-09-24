"use client";

import { motion, useReducedMotion } from "framer-motion";
import { forwardRef, useId, useState } from "react";
import { pinGroups, type Pin, type PinGroup } from "@/lib/pins";
import { PinIcon } from "./PinIcon";

type GlobePinProps = {
  pin: Pin;
  emphasized: boolean;
};

// Shape from Figma: a circle tapering to a point, in the export's 58x70 box.
const PIN_BODY =
  "M8.494 49.506A29 29 0 1 1 49.506 49.506L29 70.015Z";

type SpringHover = {
  type: "spring";
  stiffness: number;
  damping: number;
  mass: number;
};

type FadeHover = {
  duration: number;
  ease?: [number, number, number, number];
};

function hoverSpring(reduceMotion: boolean): { duration: number } | SpringHover {
  if (reduceMotion) return { duration: 0 };
  return { type: "spring", stiffness: 420, damping: 32, mass: 0.65 };
}

function hoverFade(reduceMotion: boolean): FadeHover {
  if (reduceMotion) return { duration: 0 };
  return { duration: 0.28, ease: [0.22, 1, 0.36, 1] };
}

function PhotoPin({
  image,
  open,
  reduceMotion,
}: {
  image: string;
  open: boolean;
  reduceMotion: boolean;
}) {
  const clipId = useId().replace(/:/g, "");

  return (
    <motion.span
      className="relative block w-[52px] origin-bottom aspect-[58/70] drop-shadow-[0_8px_18px_rgba(0,0,0,0.38)] desk:w-[64px]"
      initial={false}
      animate={{ scale: open ? 1.1 : 1 }}
      transition={hoverSpring(reduceMotion)}
      style={{ originX: 0.5, originY: 1 }}
    >
      <svg
        viewBox="0 0 58 70"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="29" cy="29" r="27" />
          </clipPath>
        </defs>
        <path d={PIN_BODY} fill="white" />
        <image
          href={image}
          x="2"
          y="2"
          width="54"
          height="54"
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>
    </motion.span>
  );
}

function IconPin({
  group,
  open,
  reduceMotion,
}: {
  group: PinGroup;
  open: boolean;
  reduceMotion: boolean;
}) {
  const meta = pinGroups[group];
  const spring = hoverSpring(reduceMotion);
  const fade = hoverFade(reduceMotion);

  return (
    <motion.span
      className="relative flex items-center justify-center overflow-hidden rounded-full bg-black shadow-[0_4px_14px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
      initial={false}
      animate={{
        width: open ? 64 : 34,
        height: open ? 64 : 34,
      }}
      transition={spring}
      style={{ color: meta.accent }}
    >
      <motion.span
        className="absolute grid place-items-center"
        initial={false}
        animate={{ opacity: open ? 0 : 1, scale: open ? 0.55 : 1 }}
        transition={fade}
      >
        <PinIcon group={group} className="h-4 w-4" />
      </motion.span>
      <motion.span
        className="absolute grid place-items-center"
        initial={false}
        animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.55 }}
        transition={fade}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/icons/hover-${group}.svg`} alt="" className="h-7 w-7" />
      </motion.span>
    </motion.span>
  );
}

function PinFace({
  pin,
  open,
  reduceMotion,
}: {
  pin: Pin;
  open: boolean;
  reduceMotion: boolean;
}) {
  switch (pin.kind) {
    case "photo":
      return (
        <PhotoPin
          image={pin.image}
          open={open}
          reduceMotion={reduceMotion}
        />
      );
    case "icon":
      return (
        <IconPin
          group={pin.group}
          open={open}
          reduceMotion={reduceMotion}
        />
      );
    default: {
      const _exhaustive: never = pin;
      return _exhaustive;
    }
  }
}

// Positioned by Globe.tsx, which writes a transform onto this ref every frame.
export const GlobePin = forwardRef<HTMLDivElement, GlobePinProps>(function GlobePin(
  { pin, emphasized },
  ref,
) {
  const meta = pinGroups[pin.group];
  const [open, setOpen] = useState(false);
  const photo = pin.kind === "photo";
  const reduceMotion = useReducedMotion() === true;
  const fade = hoverFade(reduceMotion);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute left-0 top-0"
      style={{ zIndex: 20 }}
    >
      <div style={{ transform: photo ? "translate(-50%, -100%)" : "translate(-50%, -50%)" }}>
        <motion.button
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: emphasized ? 1 : 0.92, opacity: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 380, damping: 24 }
          }
          aria-label={pin.city}
          onPointerEnter={() => setOpen(true)}
          onPointerLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="pointer-events-auto relative flex flex-col items-center"
          style={{ color: meta.accent }}
        >
          <motion.span
            initial={false}
            animate={{
              opacity: open ? 1 : 0,
              x: "-50%",
              y: open ? 0 : 8,
            }}
            transition={fade}
            aria-hidden={!open}
            className={`absolute bottom-full left-1/2 mb-1.5 whitespace-nowrap rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white ring-1 ring-white/15 ${
              open ? "" : "pointer-events-none"
            }`}
          >
            {pin.city}
          </motion.span>
          <PinFace pin={pin} open={open} reduceMotion={reduceMotion} />
        </motion.button>
      </div>
    </div>
  );
});
