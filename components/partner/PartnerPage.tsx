"use client";

import { useEffect, useRef, useState } from "react";
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
      <div ref={frame} className="relative w-full" style={{ height: 1121 * scale }}>
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={partnerImages.logoMark}
        alt=""
        width={148.688}
        height={86.7987}
        className="absolute left-[300px] top-[762px] z-[8] h-[86.799px] w-[148.688px] max-w-none"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={partnerImages.logoMark}
        alt=""
        width={148.688}
        height={86.7987}
        className="absolute left-[1126px] top-[762px] z-[7] h-[86.799px] w-[148.688px] max-w-none"
      />
      <div className="absolute left-[696px] top-[776.71px] z-[6] h-[57.375px] w-[252.375px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={partnerImages.logoRow}
          alt=""
          className="absolute left-[-10.4%] top-[-37.29%] h-[178.51%] w-[121.84%] max-w-none"
        />
      </div>
      <div className="absolute left-[-188px] top-[776.71px] z-[5] h-[57.375px] w-[252.375px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={partnerImages.logoRow}
          alt=""
          className="absolute left-[-10.4%] top-[-37.29%] h-[178.51%] w-[121.84%] max-w-none"
        />
      </div>
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
      <PartnerHero title={p.heroTitle} body={p.heroBody} />

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
