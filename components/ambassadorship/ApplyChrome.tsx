"use client";

import { LanguageLinks } from "@/components/LanguageLinks";

import Link from "@/components/LocaleLink";
import { t } from "@/lib/messages";
import { footerHref } from "@/lib/nav";
import { LanguageDropdown } from "../LanguageDropdown";
import { useCopy } from "../LanguageProvider";
import { Logo } from "../Logo";

/** Header and footer of the /apply and /nominate landing (moved from the old age-selection layout); the back arrow sits on a white circle at every size (Figma 37:777 / 55:135). */
export function ApplyHeader() {
  const copy = useCopy();
  return (
    <header className="absolute inset-x-0 top-0 z-50 flex h-[68px] items-center justify-between px-5 backdrop-blur-[12px] desk:h-[88px] desk:px-[64px] desk:py-[24px]">
      <Link
        href="/"
        aria-label={copy.a11y.backHome}
        className="relative flex size-8 items-center justify-center rounded-full bg-white p-1 shadow-[inset_0_0_18px_rgba(255,255,255,0.25)] desk:size-10"
      >
        <span className="flex size-6 items-center justify-center desk:size-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/apply/arrow-left.svg"
            alt=""
            width={24}
            height={24}
            className="size-5 desk:size-6"
          />
        </span>
      </Link>

      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 desk:top-[20px] desk:translate-y-0">
        <Logo
          tone="light"
          imgClassName="h-6 w-auto object-contain desk:h-12 desk:w-[134px]"
        />
      </div>

      <LanguageDropdown variant="apply" />
    </header>
  );
}

export function ApplyFooter() {
  const copy = useCopy();
  const year = new Date().getFullYear();
  return (
    <footer
      id="contact"
      className="flex flex-col gap-10 bg-cream px-5 pb-10 pt-12 desk:gap-[48px] desk:px-[64px] desk:pb-[40px] desk:pt-[64px]"
    >
      <div className="flex flex-col items-center justify-between gap-10 desk:flex-row desk:items-start desk:gap-0">
        <Logo
          tone="color"
          loading="lazy"
          imgClassName="mx-auto h-12 w-auto object-contain desk:mx-0 desk:h-[121px] desk:w-[341px] desk:object-left"
        />
        {/* Mobile: titles and links wrap at spaces (e.g. "Informations légales") so the row never
            outgrows the screen; each column still keeps its longest word whole, and under 380px the gap
            narrows so pt (Patrocinadores / Solidariedade / Informação) fits at 360. From 420px up to
            desktop the row may use the footer's side padding, as it always has, so wider phones keep
            the one-line titles. Desktop stays on one line. */}
        <div className="flex w-full justify-center gap-8 max-[380px]:gap-5 min-[420px]:max-desk:-mx-5 min-[420px]:max-desk:w-[calc(100%+40px)] desk:w-auto desk:justify-start desk:gap-[64px] desk:whitespace-nowrap">
          {copy.footer.columns.map((col, columnIndex) => (
            <div
              key={col.title}
              className="flex flex-col items-start gap-3 desk:gap-[16px]"
            >
              <p className="break-words text-[12px] font-bold tracking-[1.2px] text-[#111] uppercase">
                {col.title}
              </p>
              {col.links.map((link, linkIndex) => {
                const href = footerHref(columnIndex, linkIndex);
                const className =
                  "text-[14px] text-black/72 transition-colors hover:text-black";
                return href === "#" ? (
                  <a key={link} href="#" className={className}>
                    {link}
                  </a>
                ) : (
                  <Link key={link} href={href} className={className}>
                    {link}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center border-t border-black/10 pt-6 text-center desk:flex-row desk:pt-[24px] desk:text-left">
        <p className="w-full text-[12px] text-black/72">
          {t(copy.footer.copyright, { year })}
        </p>
        <div className="hidden desk:block">
          <LanguageLinks />
        </div>
      </div>
    </footer>
  );
}
