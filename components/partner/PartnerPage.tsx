"use client";

import Image from "next/image";
import Link from "@/components/LocaleLink";
import { useCopy } from "../LanguageProvider";
import { trail } from "@/lib/fonts";
import { partnerImages } from "@/lib/partner-assets";

function ReachOutLink({
  href = "/contact",
  light,
  compact = false,
  className,
}: {
  href?: string;
  light?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const copy = useCopy();
  return (
    <Link
      href={href}
      className={`relative z-10 flex items-center justify-center rounded-full font-semibold uppercase leading-[0.9] tracking-[0.04em] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.98] ${
        compact
          ? "h-12 w-auto shrink-0 px-7 text-[14px] desk:h-14 desk:px-8 desk:text-[16px]"
          : "h-14 w-full px-8 text-[16px] desk:h-20 desk:text-[20px]"
      } ${light ? "gradient-brand text-white" : "bg-white text-black"} ${className ?? ""}`}
    >
      {copy.partnerPage.reachOut}
    </Link>
  );
}

const WAY_STYLES = [
  "bg-black text-white",
  "bg-lime text-black",
  "bg-[linear-gradient(135deg,#ff5aa8_0%,#ec268f_100%)] text-white",
  "bg-[linear-gradient(135deg,#f6e35a_0%,#fa8d2e_100%)] text-black",
] as const;

function AudienceBand() {
  return (
    <div className="mt-10 flex justify-center desk:mt-14">
      <div className="flex w-full max-w-[1080px] items-center justify-center">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="relative -ml-[9%] aspect-square w-[32%] shrink-0 overflow-hidden rounded-full first:ml-0"
          >
            <Image
              src="/images/card-community.jpg"
              alt=""
              fill
              className="object-cover"
              style={{ objectPosition: `${index * 28}% center` }}
              sizes="280px"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaCard({
  title,
  image,
  glow,
  glowClass,
  bg,
  titleClass,
}: {
  title: string;
  image: string;
  glow: string;
  glowClass: string;
  bg: string;
  titleClass: string;
}) {
  return (
    <div
      className="relative flex min-h-[420px] flex-1 flex-col justify-between overflow-hidden rounded-[48px] p-6 desk:min-h-[613px] desk:rounded-[64px] desk:p-8"
      style={{ backgroundColor: bg }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-10%] top-[20%]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)",
        }}
      >
        <Image
          src={image}
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 900px) 415px, 90vw"
        />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src={glow}
        alt=""
        className={`pointer-events-none absolute ${glowClass}`}
      />
      <p
        className={`relative z-10 max-w-[12ch] text-[36px] leading-[0.8] tracking-[-1.44px] desk:text-[64px] desk:tracking-[-2.56px] ${titleClass}`}
      >
        {title}
      </p>
      <ReachOutLink />
    </div>
  );
}

export function PartnerPage() {
  const copy = useCopy();
  const p = copy.partnerPage;

  return (
    <div className="bg-cream">
      <section className="overflow-hidden bg-cream px-5 pb-8 pt-28 desk:px-16 desk:pb-12 desk:pt-32">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-8 desk:flex-row desk:items-end desk:justify-between">
          <h1
            className={`${trail.className} max-w-[7.2em] text-[clamp(64px,10vw,108px)] uppercase leading-[0.82] tracking-[0.03em] text-black`}
          >
            {p.heroTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-5 desk:mb-2 desk:max-w-[420px] desk:justify-end">
            <p className="max-w-[14ch] text-[22px] leading-[1.05] tracking-[-0.04em] text-black desk:text-[28px]">
              {p.heroBody}
            </p>
            <ReachOutLink compact light />
          </div>
        </div>
        <AudienceBand />
      </section>

      <section className="bg-cream px-5 py-16 desk:px-16 desk:py-24">
        <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-black desk:text-[13px]">
            {p.waysLabel}
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2 desk:gap-3">
            {p.ways.map((way, index) => (
              <li
                key={way}
                className={`flex h-[72px] min-w-[108px] items-center justify-center rounded-[24px] px-5 text-[13px] font-semibold uppercase tracking-[0.08em] desk:h-[92px] desk:min-w-[132px] desk:rounded-[28px] desk:px-6 desk:text-[15px] ${WAY_STYLES[index]}`}
              >
                {way}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-[520px] text-[18px] leading-[1.2] tracking-[-0.03em] text-black desk:text-[24px]">
            {p.waysBody}
          </p>

          <div
            className="mt-12 w-full rounded-[36px] px-6 py-10 desk:mt-16 desk:rounded-[48px] desk:px-12 desk:py-14"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 80% at 50% 42%, #e7f26a 0%, rgba(255, 214, 120, 0.55) 38%, rgba(255, 176, 214, 0.35) 68%, rgba(255,255,255,0.92) 100%)",
            }}
          >
            <h2 className="text-[28px] leading-[0.95] tracking-[-0.04em] text-black desk:text-[36px]">
              {p.rewardsTitle}
            </h2>
            <ul className="mt-8 grid gap-6 text-left desk:mt-10 desk:grid-cols-3 desk:gap-x-8 desk:gap-y-8">
              {p.rewards.map((reward) => (
                <li
                  key={reward}
                  className="flex gap-3 text-[14px] leading-[1.3] tracking-[-0.02em] text-black desk:text-[16px]"
                >
                  <span aria-hidden className="mt-[0.4em] size-2 shrink-0 rounded-full bg-[#6d5cff]" />
                  <span>{reward}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-cream px-5 pb-16 desk:px-8 desk:pb-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 desk:flex-row desk:gap-4">
          <CtaCard
            title={p.ambassador}
            image={partnerImages.ctaAmbassador}
            glow={partnerImages.glowAmbassador}
            glowClass="left-[101px] top-[-126px] h-[252.5px] w-[286.81px] rotate-180"
            bg="#000000"
            titleClass="text-white"
          />
          <CtaCard
            title={p.storyline}
            image={partnerImages.ctaStoryline}
            glow={partnerImages.glowStoryline}
            glowClass="left-[-69.5px] top-[25px] h-[258.83px] w-[294px]"
            bg="#EC268F"
            titleClass="text-white"
          />
          <CtaCard
            title={p.speaker}
            image={partnerImages.ctaSpeaker}
            glow={partnerImages.glowSpeaker}
            glowClass="left-[179px] top-[-45px] h-[252.5px] w-[286.81px] rotate-180"
            bg="#FA8D2E"
            titleClass="text-black"
          />
        </div>
      </section>
    </div>
  );
}
