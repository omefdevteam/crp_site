"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import { useCopy } from "../LanguageProvider";
import { trail } from "@/lib/fonts";
import { partnerImages } from "@/lib/partner-assets";

function ReachOutLink({
  href = "/partner/reach-out",
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

function WayTile({
  label,
  className,
  glow,
  glowClass,
}: {
  label: string;
  className: string;
  glow?: string;
  glowClass?: string;
}) {
  return (
    <div
      className={`relative flex aspect-square min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[32px] p-8 ${className}`}
    >
      {glow ? (
        <div aria-hidden className={`pointer-events-none absolute ${glowClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={glow} className="absolute max-w-none" style={{ inset: "-36% -31%" }} />
        </div>
      ) : null}
      <p className="relative text-center text-[13.5px] font-semibold uppercase leading-[0.9] tracking-[0.54px] desk:text-[16px] desk:tracking-[1.28px]">
        {label}
      </p>
    </div>
  );
}

function PartnerHero({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / 1200);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="overflow-hidden bg-cream">
      <div className="relative flex h-[469px] items-center justify-center overflow-hidden rounded-b-[88px] px-3 pb-3 pt-[68px] desk:hidden">
        <Image
          src={partnerImages.heroPhoto}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <h1
          className={`${trail.className} relative z-10 w-[322px] max-w-full text-center text-[90px] uppercase leading-[0.9] tracking-[3.6px] text-white`}
        >
          {title}
        </h1>
      </div>
      <div ref={frame} className="relative hidden w-full desk:block" style={{ height: 1121 * scale }}>
        <div
          className="absolute left-0 top-0 h-[1121px] w-[1200px] origin-top-left overflow-hidden bg-cream"
          style={{ transform: `scale(${scale})` }}
        >
      <Image
        src={partnerImages.heroPhoto}
        alt=""
        width={1200}
        height={558}
        priority
        className="absolute left-0 top-0 h-[558px] w-[1200px] rounded-bl-[154px] rounded-br-[154px] object-cover"
      />
      <h1
        className={`${trail.className} absolute left-[64px] top-[285.5px] z-[4] w-[1072px] text-[130px] uppercase leading-[0.9] tracking-[5.2px] text-white`}
      >
        {title}
      </h1>
      <div className="absolute left-1/2 top-[418px] z-[2] flex -translate-x-1/2 items-center justify-end gap-[48px]">
        <p className="w-[300px] text-[32px] leading-[0.9] tracking-[-1.28px] text-white">
          {body}
        </p>
        <ReachOutLink
          compact
          className="!h-[80px] !w-[300px] !px-8 !text-[20px] !tracking-[0.8px]"
          light
        />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={partnerImages.heroUnion}
        alt=""
        width={1760}
        height={440}
        className="absolute left-[-280px] top-[585px] z-[3] h-[440px] w-[1760px] max-w-none"
      />
        </div>
      </div>
    </section>
  );
}

function CtaCard({
  title,
  image,
  glow,
  glowClass,
  bg,
  titleClass,
  fade,
  href,
}: {
  title: string;
  image: string;
  glow: string;
  glowClass: string;
  bg: string;
  titleClass: string;
  fade: string;
  href: string;
}) {
  return (
    <div
      className="relative flex h-[371px] flex-1 flex-col items-start justify-between overflow-hidden rounded-[64px] p-8 desk:h-full"
      style={{ backgroundColor: bg }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[163px] h-[612px] w-[415px] -translate-x-1/2"
      >
        <Image src={image} alt="" fill className="object-cover" sizes="415px" />
        <div className="absolute inset-0" style={{ backgroundImage: fade }} />
        <div
          className="absolute inset-x-0 top-0 h-24"
          style={{ backgroundImage: `linear-gradient(to bottom, ${bg}, transparent)` }}
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
        className={`relative z-10 max-w-[12ch] text-[40px] leading-none tracking-[-1.6px] desk:text-[64px] desk:leading-[0.8] desk:tracking-[-2.56px] ${titleClass}`}
      >
        {title}
      </p>
      <ReachOutLink href={href} className="!h-auto !py-7 !text-[14px] !tracking-[0.56px] desk:!h-20 desk:!py-0 desk:!text-[20px] desk:!tracking-[0.04em]" />
    </div>
  );
}

export function PartnerPage() {
  const copy = useCopy();
  const p = copy.partnerPage;

  return (
    <div className="bg-cream">
      <PartnerHero title={p.heroTitle} body={p.heroBody} />

      <section id="ways" className="flex justify-center bg-cream px-0 pb-3 pt-[68px] desk:px-0 desk:pb-24 desk:pt-0">
        <div className="flex w-full max-w-[632px] flex-col items-start gap-8">
          <p className="w-full text-center text-[13.5px] font-semibold uppercase leading-[0.9] tracking-[0.54px] text-black desk:text-[16px] desk:tracking-[1.28px]">
            {p.waysLabel}
          </p>
          <div className="flex w-full">
            <div className="flex aspect-[600/300] min-w-0 flex-1">
              <WayTile label={p.ways[0]} className="bg-black text-white" />
              <WayTile
                label={p.ways[1]}
                className="bg-lime text-black"
                glow={partnerImages.wayVenues}
                glowClass="left-[109px] top-[82px] h-[214.5px] w-[284.68px]"
              />
            </div>
            <div className="flex aspect-[600/300] min-w-0 flex-1">
              <WayTile
                label={p.ways[2]}
                className="bg-magenta text-black"
                glow={partnerImages.wayPerks}
                glowClass="left-[-72px] top-[-187px] h-[258.83px] w-[294px]"
              />
              <WayTile
                label={p.ways[3]}
                className="bg-orange text-black"
                glow={partnerImages.wayResources}
                glowClass="left-[-32px] top-[32px] h-[252.5px] w-[286.81px] rotate-180"
              />
            </div>
          </div>
          <p className="w-full text-[20px] leading-none tracking-[-0.8px] text-black desk:text-[32px] desk:tracking-[-1.28px]">
            {p.waysBody}
          </p>
          <div className="relative flex h-[390px] w-full flex-col justify-center gap-6 overflow-hidden rounded-[64px] bg-white p-8 desk:aspect-square desk:h-auto desk:p-16">
            <div aria-hidden className="pointer-events-none absolute left-[-32px] top-[-392px] h-[634px] w-[696px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                src={partnerImages.rewardsGlow}
                className="absolute max-w-none"
                style={{ inset: "-27% -22% -26% -24%" }}
              />
            </div>
            <h2 className="relative flex flex-1 items-center justify-center text-center text-[24px] leading-none tracking-[-0.96px] text-black desk:text-[32px] desk:tracking-[-1.28px]">
              {p.rewardsTitle}
            </h2>
            <div className="relative flex flex-col gap-8">
              {[p.rewards.slice(0, 3), p.rewards.slice(3)].map((row) => (
                <div key={row[0]} className="flex gap-3">
                  {row.map((reward) => (
                    <div key={reward} className="flex min-w-0 flex-1 flex-col justify-between gap-3 self-stretch">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={partnerImages.sealCheck}
                        alt=""
                        width={24}
                        height={24}
                        className="size-4 max-w-none desk:size-6"
                      />
                      <p className="text-[15px] leading-[1.2] tracking-[-0.6px] text-black/84 desk:text-[20px] desk:tracking-[-0.8px]">
                        {reward}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream py-24">
        <div className="mx-auto flex h-auto w-full max-w-[1200px] flex-col desk:h-[613px] desk:flex-row">
          <div className="relative flex h-[570px] w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-[64px] bg-lime p-6 desk:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src={partnerImages.rewardsGlow}
              alt=""
              className="pointer-events-none absolute left-[64px] top-[-67px] h-[317px] w-[348px] max-w-none"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src={partnerImages.rewardsGlow}
              alt=""
              className="pointer-events-none absolute left-[-109px] top-[201px] h-[317px] w-[348px] max-w-none -scale-y-100"
            />
            <div className="relative min-h-0 w-[259px] flex-1 overflow-hidden rounded-[44px]">
              <Image
                src={partnerImages.ctaOrganization}
                alt=""
                fill
                className="object-cover"
                sizes="259px"
              />
            </div>
            <p className="w-full text-center text-[40px] leading-none tracking-[-1.6px] text-black">
              {p.heroBody}
            </p>
            <div className="flex w-full flex-col items-center px-8">
              <ReachOutLink
                href="/partner/reach-out?support=organization"
                className="!h-auto !py-7 !text-[14px] !tracking-[0.56px]"
              />
              <Link
                href="/about"
                className="py-7 text-[14px] font-semibold uppercase leading-[0.9] tracking-[0.56px] text-black"
              >
                {p.learnMore}→
              </Link>
            </div>
          </div>
          <CtaCard
            title={p.ambassador}
            image={partnerImages.ctaAmbassador}
            glow={partnerImages.glowAmbassador}
            glowClass="left-[101px] top-[-126px] h-[252.5px] w-[286.81px] rotate-180"
            bg="#000000"
            titleClass="text-white"
            fade="radial-gradient(ellipse at 50% 34%, transparent 0%, #000 70%)"
            href="/partner/reach-out?support=ambassador"
          />
          <CtaCard
            title={p.storyline}
            image={partnerImages.ctaStoryline}
            glow={partnerImages.glowStoryline}
            glowClass="left-[-70px] top-[25px] h-[259px] w-[294px]"
            bg="#EC268F"
            titleClass="text-white"
            fade="radial-gradient(ellipse at 50% 34%, transparent 0%, #ec268f 70%)"
            href="/partner/reach-out?support=storyline"
          />
          <CtaCard
            title={p.speaker}
            image={partnerImages.ctaSpeaker}
            glow={partnerImages.glowSpeaker}
            glowClass="left-[179px] top-[-45px] h-[252.5px] w-[286.81px] rotate-180"
            bg="#FA8D2E"
            titleClass="text-black"
            fade="radial-gradient(ellipse at 50% 34%, transparent 0%, #fa8d2e 72%)"
            href="/partner/reach-out?support=speaker"
          />
        </div>
      </section>
    </div>
  );
}
