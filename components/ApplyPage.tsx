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
      className={`relative flex aspect-square w-full flex-col justify-between overflow-hidden p-6 text-white desk:h-full desk:flex-1 desk:aspect-auto desk:p-[32px] ${
        glow === "lime" ? "bg-ink" : "bg-magenta"
      } rounded-[40px] desk:rounded-[64px]`}
    >
      {glow === "lime" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute left-[101px] top-[-126px] hidden h-[252.5px] w-[286.81px] items-center justify-center desk:flex"
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
          className="pointer-events-none absolute left-[-69.5px] top-[25px] hidden h-[258.83px] w-[294px] desk:block"
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
      <p className="relative min-w-full text-[64px] leading-[0.8] tracking-[-0.04em] desk:text-[96px] desk:tracking-[-3.84px]">
        {title}
      </p>
      <button
        type="button"
        onClick={onExpress}
        className="relative z-10 flex h-[64px] w-full items-center justify-center rounded-full bg-white px-8 text-[16px] font-semibold uppercase leading-[0.9] tracking-[0.64px] text-black mix-blend-hard-light desk:h-[80px] desk:p-[32px] desk:text-[20px] desk:tracking-[0.8px]"
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
            className="relative z-10 flex h-[64px] w-full items-center justify-center rounded-full px-8 text-[16px] font-semibold uppercase leading-[0.9] tracking-[0.64px] text-white mix-blend-hard-light desk:h-[80px] desk:p-[32px] desk:text-[20px] desk:tracking-[0.8px]"
            style={{ backgroundImage: APPLY_GRADIENT }}
          >
            {copy.apply.applyNow}
          </Link>
        }
        belowHero={
          <div className="flex w-full flex-col desk:aspect-[948/316] desk:flex-row desk:items-stretch">
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
            <div className="relative flex aspect-square w-full items-start overflow-hidden rounded-[40px] bg-white p-6 desk:h-full desk:flex-1 desk:aspect-auto desk:rounded-[64px] desk:p-[32px]">
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
