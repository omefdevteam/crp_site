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
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5 desk:px-16 desk:py-6">
        <Link
          href="/"
          aria-label={copy.a11y.back}
          className="flex items-center rounded-full bg-white p-[4px] text-black shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
        >
          <span className="flex size-[32px] items-center justify-center">
            <FigmaImg
              src={programIcons.arrowLeftHeader}
              alt=""
              width={24}
              height={24}
              className="size-[24px] brightness-0"
            />
          </span>
        </Link>

        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <Logo
            tone="light"
            imgClassName="h-[40px] w-auto desk:h-[48px]"
          />
        </div>

        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            aria-label={copy.a11y.discord}
            className="flex h-[40px] w-[56px] items-center justify-center rounded-full bg-[#5865f2]"
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
