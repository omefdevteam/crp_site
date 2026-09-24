"use client";

import Link from "@/components/LocaleLink";
import { useCallback, useState } from "react";
import { trail } from "@/lib/fonts";
import {
  AgeSelectionLayout,
  APPLY_GRADIENT,
} from "./age-selection/AgeSelectionLayout";
import {
  ExpressInterestPopup,
  type InterestAgeGroup,
} from "./ExpressInterestPopup";
import { useCopy } from "./LanguageProvider";

function InterestCard({
  title,
  glow,
  cta,
  onExpress,
}: {
  title: string;
  glow: "lime" | "orange";
  cta: string;
  onExpress: () => void;
}) {
  return (
    <div
      className={`relative flex h-[257px] w-[244px] shrink-0 flex-col justify-between overflow-hidden px-3 pb-3 pt-6 text-white desk:h-full desk:w-auto desk:flex-1 desk:p-[32px] ${
        glow === "lime" ? "bg-ink" : "bg-magenta"
      } rounded-[44px] desk:rounded-[64px]`}
    >
      {glow === "lime" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute left-[101px] top-[-126px] flex h-[252.5px] w-[286.81px] items-center justify-center"
        >
          <div className="relative h-[252.5px] w-[286.81px] rotate-180">
            <span className="absolute inset-[-35.72%_-31.45%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/apply/glow-lime.svg"
                alt=""
                className="block size-full max-w-none"
              />
            </span>
          </div>
        </div>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute left-[-69.5px] top-[25px] h-[258.83px] w-[294px]"
        >
          <span className="absolute inset-[-35.72%_-31.45%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/apply/glow-orange.svg"
              alt=""
              className="block size-full max-w-none"
            />
          </span>
        </div>
      )}
      <p className="relative min-w-full text-[48px] leading-[0.8] tracking-[-1.92px] desk:text-[96px] desk:tracking-[-3.84px]">
        {title}
      </p>
      <button
        type="button"
        onClick={onExpress}
        className="relative z-10 flex h-14 w-full items-center justify-center rounded-full bg-white px-4 text-[14px] font-semibold uppercase leading-[0.9] tracking-[0.56px] text-black mix-blend-hard-light transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.98] desk:h-[80px] desk:px-8 desk:text-[20px] desk:tracking-[0.8px]"
      >
        {cta}
      </button>
    </div>
  );
}

export function ApplyPage() {
  const copy = useCopy();
  const [interestGroup, setInterestGroup] = useState<InterestAgeGroup | null>(
    null,
  );
  const closeInterest = useCallback(() => setInterestGroup(null), []);

  return (
    <>
      <AgeSelectionLayout
        title={copy.apply.title}
        subtitle={copy.apply.subtitle}
        headline={copy.apply.headline}
        body={copy.apply.body}
        cta={
          <Link
            href="/programs?intent=apply"
            aria-label={copy.a11y.programDetails}
            className="relative z-10 flex h-14 w-full items-center justify-center rounded-full px-4 text-[14px] font-semibold uppercase leading-[0.9] tracking-[0.56px] text-white mix-blend-hard-light transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.98] desk:h-[80px] desk:px-8 desk:text-[20px] desk:tracking-[0.8px]"
            style={{ backgroundImage: APPLY_GRADIENT }}
          >
            {copy.apply.applyNow}
          </Link>
        }
        belowHero={
          <div className="no-scrollbar flex w-full overflow-x-auto desk:aspect-[948/316] desk:overflow-visible desk:flex-row desk:items-stretch">
            <InterestCard
              title={copy.apply.ages1518}
              glow="lime"
              cta={copy.apply.interest}
              onExpress={() => setInterestGroup("15_18")}
            />
            <InterestCard
              title={copy.apply.ages2734}
              glow="orange"
              cta={copy.apply.interest}
              onExpress={() => setInterestGroup("27_34")}
            />
            <div className="relative flex size-[244px] shrink-0 items-start overflow-hidden rounded-[64px] bg-white p-6 desk:h-full desk:w-auto desk:flex-1 desk:p-[32px]">
              <p
                aria-label={copy.a11y.moreComingSoon}
                className={`${trail.className} absolute left-6 top-[72px] w-[min(100%-3rem,280px)] text-[80px] uppercase leading-[0.67] tracking-[-0.04em] text-black/32 desk:left-[32px] desk:top-[calc(50%-176.67px)] desk:w-[407px] desk:text-[135.429px] desk:tracking-[-5.4171px]`}
              >
                {copy.apply.more.split("\n").map((line, i) => (
                  <span key={`${line}-${i}`}>
                    {i > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
        }
      />

      <ExpressInterestPopup
        open={interestGroup !== null}
        ageGroup={interestGroup ?? "15_18"}
        onClose={closeInterest}
      />
    </>
  );
}
