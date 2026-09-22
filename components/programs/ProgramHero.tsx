"use client";

import { programIcons, programPhotos } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { FigmaImg } from "./FigmaImg";
import { ProgramsHeader } from "./ProgramsHeader";

/** Three 632px-wide youth photos in a 1896px band, centered and clipped to the viewport. */
const PHOTOS: readonly {
  src: string;
  imgClass?: string;
  flip?: boolean;
  muted: boolean;
}[] = [
  {
    src: programPhotos.heroLeft,
    // Figma 2212:184 wraps the fill with scaleY(-1) + rotate 180 (horizontal flip).
    flip: true,
    muted: false,
  },
  {
    src: programPhotos.heroMid,
    muted: false,
  },
  {
    src: programPhotos.heroRight,
    imgClass: "object-[28%_42%]",
    muted: true,
  },
];

export function ProgramHero() {
  const copy = useCopy();
  return (
    <section className="relative overflow-hidden bg-cream">
      <ProgramsHeader />

      <div className="relative h-[420px] desk:h-[558px]">
        {/* 1896px band (3 × 632) centered so the middle photo is centered and the sides clip. */}
        <div className="absolute left-1/2 top-0 flex h-full -translate-x-1/2">
          {PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className="relative h-full w-[632px] shrink-0 overflow-hidden rounded-[88px]"
            >
              <div
                className={`absolute inset-0 ${photo.flip ? "-scale-y-100 rotate-180" : ""}`}
              >
                <FigmaImg
                  src={photo.src}
                  alt=""
                  width={632}
                  height={558}
                  className={`size-full object-cover ${photo.imgClass ?? ""}`}
                />
              </div>
              <div className="absolute inset-0 rounded-[88px] bg-gradient-to-b from-transparent from-[72%] to-black/20" />
              {photo.muted ? (
                <span className="absolute bottom-[64px] right-[64px] flex size-[32px] items-center justify-center rounded-full bg-white/12 p-[8px]">
                  <FigmaImg
                    src={programIcons.speakerX}
                    alt=""
                    width={16}
                    height={16}
                    className="size-[16px]"
                  />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Page title, overlaid near the bottom of the band. */}
        <div className="absolute inset-x-0 bottom-[48px] flex justify-center px-6 desk:bottom-[64px]">
          <h1 className="max-w-[592px] text-center text-[32px] font-normal leading-[0.9] tracking-[-1.28px] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.35)] desk:text-[48px] desk:tracking-[-1.92px]">
            {copy.programs.title.split("\n").map((line, i) => (
              <span key={line}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </h1>
        </div>
      </div>
    </section>
  );
}
