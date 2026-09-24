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

      <div className="relative h-[466px] desk:h-[558px]">
        {/* Phone: the middle photo fills the frame. From desk, a 1896px band (3 × 632) stays centered. */}
        <div className="absolute left-0 top-0 flex h-full w-full desk:left-1/2 desk:w-auto desk:-translate-x-1/2">
          {PHOTOS.map((photo, index) => (
            <div
              key={photo.src}
              className={`relative h-full shrink-0 overflow-hidden rounded-b-[88px] desk:w-[632px] desk:rounded-[88px] ${
                index === 1 ? "w-full" : "hidden desk:block"
              }`}
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
        <div className="absolute inset-x-0 bottom-[32px] flex justify-center px-8 desk:bottom-[64px] desk:px-6">
          <h1 className="max-w-[592px] text-center text-[28px] font-normal leading-[0.9] tracking-[-1.12px] text-white [text-shadow:0_0_4px_rgba(0,0,0,0.25)] desk:text-[48px] desk:tracking-[-1.92px]">
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
