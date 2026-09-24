"use client";

import Link from "@/components/LocaleLink";
import { programIcons } from "@/lib/program-assets";
import { LanguageSwitch } from "../LanguageSwitch";
import { useCopy } from "../LanguageProvider";
import { Logo } from "../Logo";
import { FigmaImg } from "./FigmaImg";

/** Static top bar from the Figma "header-navigation" node — sits over the hero photos. */
export function ProgramsHeader() {
  const copy = useCopy();
  return (
    <div className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-8 desk:h-auto desk:px-16 desk:py-6">
        <Link
          href="/"
          aria-label={copy.a11y.back}
          className="flex size-8 items-center justify-center rounded-full bg-white p-1 text-black shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 active:scale-95 desk:size-auto desk:p-1"
        >
          <span className="flex size-8 items-center justify-center">
            <FigmaImg
              src={programIcons.arrowLeftHeader}
              alt=""
              width={16}
              height={16}
              className="size-4 brightness-0 desk:size-6"
            />
          </span>
        </Link>

        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <Logo
            tone="light"
            imgClassName="h-7 w-auto desk:h-12"
          />
        </div>

        <div className="flex items-center gap-1 desk:gap-2">
          <button
            type="button"
            aria-label={copy.a11y.discord}
            className="flex h-[27px] items-center justify-center rounded-full bg-[#5865f2] px-3 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 active:scale-95 desk:h-10 desk:w-14 desk:px-0"
          >
            <FigmaImg
              src={programIcons.discord}
              alt=""
              width={20.263}
              height={15.36}
              className="h-[15.36px] w-[20.263px]"
            />
          </button>

          <LanguageSwitch />
        </div>
      </div>
    </div>
  );
}
