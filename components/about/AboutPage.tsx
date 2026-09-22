"use client";

import Image from "next/image";
import { TicketTab } from "../TicketTab";
import { useCopy } from "../LanguageProvider";
import { trail } from "@/lib/fonts";
import { aboutImages, aboutTeamPhotos } from "@/lib/about-assets";

function TeamCard({
  photo,
  name,
  role,
  featured = false,
}: {
  photo: string;
  name: string;
  role: string;
  featured?: boolean;
}) {
  return (
    <div
      className={
        featured
          ? "relative flex h-[140px] w-full max-w-[320px] shrink-0 flex-col items-start justify-end overflow-hidden rounded-[48px] px-6 py-4 desk:h-[200px] desk:w-[320px] desk:max-w-none desk:rounded-[64px] desk:px-8 desk:py-6"
          : "relative flex size-[140px] shrink-0 flex-col items-center justify-end overflow-hidden rounded-[48px] px-4 py-3 desk:size-[200px] desk:rounded-[64px] desk:px-8 desk:py-6"
      }
    >
      <Image
        src={photo}
        alt=""
        fill
        className={featured ? "object-cover object-[center_18%]" : "object-cover"}
        sizes={featured ? "320px" : "200px"}
      />
      {!featured && <div aria-hidden className="absolute inset-0 bg-black/48" />}
      <div className="absolute left-1/2 top-0 z-10 origin-top -translate-x-1/2 scale-[0.55] desk:scale-[0.6]">
        <TicketTab label={role} placement="top" size="lg" />
      </div>
      <p className="relative z-10 text-center text-[16px] leading-none tracking-[-0.64px] text-white desk:text-[24px] desk:tracking-[-0.96px]">
        {name}
      </p>
    </div>
  );
}

function WhatWeDoCard({
  title,
  body,
  bg,
  glow,
  glowClass,
  light,
}: {
  title: string;
  body: string;
  bg: string;
  glow: string;
  glowClass: string;
  light?: boolean;
}) {
  const text = light ? "text-white" : "text-black";
  return (
    <div
      className={`relative flex aspect-square flex-1 flex-col justify-between overflow-hidden rounded-[48px] p-6 desk:rounded-[64px] desk:p-8 ${text}`}
      style={{ backgroundColor: bg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img aria-hidden src={glow} alt="" className={`pointer-events-none absolute ${glowClass}`} />
      <p className="relative z-10 max-w-[12ch] text-[36px] leading-[0.8] tracking-[-1.44px] desk:text-[64px] desk:tracking-[-2.56px]">
        {title}
      </p>
      <p className="relative z-10 text-[18px] leading-none tracking-[-0.72px] desk:text-[32px] desk:tracking-[-1.28px]">
        {body}
      </p>
    </div>
  );
}

export function AboutPage() {
  const copy = useCopy();
  const a = copy.aboutUs;
  const [first, second, ...rest] = aboutTeamPhotos;

  return (
    <div className="overflow-x-hidden bg-cream">
      {/* Hero — Figma 2191:181/185: oversized plate, 50px blur, cream fade into the statement. */}
      <section className="relative flex min-h-[100svh] items-center justify-center px-5 py-24 desk:min-h-[805px] desk:px-16 desk:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 z-0 h-[128%] w-[110%] -translate-x-1/2 overflow-hidden"
        >
          <Image
            src={aboutImages.hero}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="110vw"
          />
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 48%, black 72%)",
              maskImage: "linear-gradient(to bottom, transparent 48%, black 72%)",
            }}
          >
            <Image
              src={aboutImages.hero}
              alt=""
              fill
              className="scale-110 object-cover blur-[50px]"
              sizes="110vw"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, #000 4.5%, rgba(0,0,0,0.66) 11%, transparent 23%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[42%]"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, transparent 0%, rgba(244,241,234,0.28) 38%, #f4f1ea 78%, #f4f1ea 100%)",
            }}
          />
        </div>
        <div className="relative z-10 flex max-w-[632px] flex-col items-center gap-8 text-center text-white desk:gap-12">
          <h1
            className={`${trail.className} text-[clamp(64px,18vw,130px)] uppercase leading-[0.9] tracking-[0.04em] desk:tracking-[5.2px]`}
          >
            {a.heroTitle}
          </h1>
          <p className="text-[20px] leading-[0.9] tracking-[-0.8px] desk:text-[32px] desk:tracking-[-1.28px]">
            {a.heroBody}
          </p>
        </div>
      </section>

      {/* Statement — transparent so the hero blur/fade sits behind the top of this block */}
      <section className="relative z-10 flex items-center justify-center px-5 py-20 desk:min-h-[805px] desk:px-16 desk:py-24">
        <div className="flex max-w-[632px] flex-col gap-8 desk:gap-12">
          <p className="text-[28px] leading-[0.9] tracking-[-1.12px] text-black desk:text-[48px] desk:tracking-[-1.92px]">
            {a.statement}
          </p>
          <p className="text-[20px] leading-[0.9] tracking-[-0.8px] text-black desk:text-[32px] desk:tracking-[-1.28px]">
            {a.statementTag}
          </p>
        </div>
      </section>

      {/* What we do */}
      <section className="bg-black px-0 py-16 text-white desk:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 desk:gap-8 desk:px-16">
          <h2 className="text-[32px] leading-[0.9] tracking-[-1.28px] desk:text-[48px] desk:tracking-[-1.92px]">
            {a.whatTitle}
          </h2>
          <p className="text-[18px] leading-[0.9] tracking-[-0.72px] desk:text-[32px] desk:tracking-[-1.28px]">
            {a.whatBody}
          </p>
        </div>
        <div className="mt-8 flex flex-col desk:mt-12 desk:flex-row">
          <WhatWeDoCard
            title={a.cards[0].title}
            body={a.cards[0].body}
            bg="#ffffff"
            glow={aboutImages.ellipseConnect}
            glowClass="left-[20%] top-[-40%] h-[70%] w-[80%] rotate-180"
          />
          <WhatWeDoCard
            title={a.cards[1].title}
            body={a.cards[1].body}
            bg="#ec268f"
            glow={aboutImages.ellipseStories}
            glowClass="left-[-20%] top-[8%] h-[70%] w-[85%]"
            light
          />
          <WhatWeDoCard
            title={a.cards[2].title}
            body={a.cards[2].body}
            bg="#fa8d2e"
            glow={aboutImages.ellipseChange}
            glowClass="bottom-[-10%] right-[-15%] h-[70%] w-[80%] rotate-180"
          />
        </div>
      </section>

      {/* Team — Figma 2191:207: wide first row, then centered rows of 3 */}
      <section className="bg-black px-5 py-16 text-white desk:px-16 desk:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-10 desk:gap-12">
          <h2 className="w-full text-center text-[32px] leading-[0.9] tracking-[-1.28px] desk:text-[48px] desk:tracking-[-1.92px]">
            {a.teamTitle}
          </h2>

          <div className="flex w-full flex-col items-center">
            <div className="flex w-full flex-col items-center desk:flex-row desk:justify-center">
              <TeamCard photo={first} name={a.memberName} role={a.memberRole} />
              <div className="flex w-full max-w-[600px] flex-col items-center desk:h-[200px] desk:w-[600px] desk:max-w-none desk:flex-row desk:items-end">
                <TeamCard
                  featured
                  photo={aboutImages.featured}
                  name={a.memberName}
                  role={a.memberRole}
                />
                <div className="flex h-[140px] w-full max-w-[280px] items-end p-6 desk:h-[200px] desk:w-[280px] desk:max-w-none desk:p-8">
                  <p className="text-[14px] leading-[1.2] tracking-[-0.56px] text-white desk:text-[20px] desk:tracking-[-0.8px]">
                    {a.teamQuote}
                  </p>
                </div>
              </div>
              <TeamCard photo={second} name={a.memberName} role={a.memberRole} />
            </div>

            <div className="flex w-full max-w-[280px] flex-wrap justify-center desk:max-w-[600px]">
              {rest.map((photo) => (
                <TeamCard
                  key={photo}
                  photo={photo}
                  name={a.memberName}
                  role={a.memberRole}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
