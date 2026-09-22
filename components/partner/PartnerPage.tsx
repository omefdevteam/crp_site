"use client";

import Image from "next/image";
import Link from "next/link";
import { useCopy } from "../LanguageProvider";
import { ProgramResonate } from "../programs/ProgramResonate";
import { Sponsors } from "../Sponsors";
import { trail } from "@/lib/fonts";
import { partnerImages } from "@/lib/partner-assets";

function ReachOutLink({
  href = "/contact",
  light,
  className,
}: {
  href?: string;
  light?: boolean;
  className?: string;
}) {
  const copy = useCopy();
  return (
    <Link
      href={href}
      className={`relative z-10 flex h-14 w-full items-center justify-center rounded-full px-8 text-[16px] font-semibold uppercase leading-[0.9] tracking-[0.04em] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.98] desk:h-20 desk:text-[20px] ${
        light
          ? "gradient-brand text-white"
          : "bg-white text-black"
      } ${className ?? ""}`}
    >
      {copy.partnerPage.reachOut}
    </Link>
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
      {/* Hero */}
      <section className="bg-cream px-5 py-16 desk:px-16 desk:py-24">
        <div className="relative flex min-h-[520px] flex-col items-center justify-center overflow-hidden rounded-[88px] px-6 py-16 desk:min-h-[613px] desk:rounded-[154px] desk:px-16 desk:py-24">
          <div className="absolute inset-0 origin-[50%_10%] [transform:scale(2.2)] desk:[transform:none]">
            <Image
              src={partnerImages.hero}
              alt=""
              fill
              priority
              className="object-cover object-[center_10%]"
              sizes="100vw"
            />
          </div>
          <div aria-hidden className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 flex max-w-[876px] flex-col items-center gap-6 text-center text-white desk:gap-6">
            <h1
              className={`${trail.className} text-[clamp(56px,12vw,130px)] uppercase leading-[0.9] tracking-[0.04em] desk:tracking-[5.2px]`}
            >
              {p.heroTitle}
            </h1>
            <p className="text-[20px] leading-[0.9] tracking-[-0.8px] desk:text-[32px] desk:tracking-[-1.28px]">
              {p.heroBody}
            </p>
            <ReachOutLink light className="mt-2 w-full max-w-[408px]" />
          </div>
        </div>
      </section>

      {/* Resonate — same block as youth program (per Figma) */}
      <section className="bg-cream px-5 pb-16 desk:px-16 desk:pb-24">
        <div className="mx-auto max-w-[632px]">
          <ProgramResonate />
        </div>
      </section>

      {/* Partnership CTAs */}
      <section className="bg-cream px-5 py-16 desk:px-0 desk:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 desk:flex-row desk:gap-0 desk:px-0">
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

      <Sponsors />
    </div>
  );
}
