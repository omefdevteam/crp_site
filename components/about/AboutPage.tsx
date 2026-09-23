"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useCopy } from "../LanguageProvider";
import { trail } from "@/lib/fonts";
import { aboutTeamPhotos } from "@/lib/about-assets";

const HOME_STILLS = [
  aboutTeamPhotos[3],
  aboutTeamPhotos[6],
  aboutTeamPhotos[10],
  aboutTeamPhotos[14],
] as const;

function FaceGlobe() {
  const outer = aboutTeamPhotos.slice(0, 8);
  const inner = aboutTeamPhotos.slice(8, 14);

  const place = (index: number, count: number, radius: number) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return {
      left: `${50 + Math.cos(angle) * radius}%`,
      top: `${50 + Math.sin(angle) * radius}%`,
    };
  };

  return (
    <div aria-hidden className="relative size-[min(92vw,460px)] desk:size-[560px]">
      <div className="absolute left-1/2 top-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#6d5cff_0%,rgba(109,92,255,0.35)_46%,transparent_70%)]" />
      {outer.map((photo, index) => (
        <span
          key={photo}
          className="absolute size-[18%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-2 ring-white/80"
          style={place(index, outer.length, 38)}
        >
          <Image src={photo} alt="" fill className="object-cover" sizes="100px" />
        </span>
      ))}
      {inner.map((photo, index) => (
        <span
          key={photo}
          className="absolute size-[13%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-2 ring-white/80"
          style={place(index, inner.length, 22)}
        >
          <Image src={photo} alt="" fill className="object-cover" sizes="72px" />
        </span>
      ))}
    </div>
  );
}

function PhotoPin({
  src,
  className,
  clipId,
}: {
  src: string;
  className?: string;
  clipId: string;
}) {
  return (
    <svg viewBox="0 0 58 70" className={className} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <circle cx="29" cy="29" r="26" />
        </clipPath>
      </defs>
      <path d="M8.494 49.506A29 29 0 1 1 49.506 49.506L29 70.015Z" fill="white" />
      <image
        href={src}
        x="3"
        y="3"
        width="52"
        height="52"
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />
    </svg>
  );
}

function WorkCard({
  label,
  title,
  className,
  titleClass,
  children,
}: {
  label: string;
  title: string;
  className: string;
  titleClass: string;
  children?: ReactNode;
}) {
  return (
    <article className={`relative aspect-square overflow-hidden rounded-[28px] p-4 desk:rounded-[40px] desk:p-6 ${className}`}>
      {children}
      <div className={`relative z-10 flex h-full flex-col ${titleClass}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] desk:text-[13px]">{label}</p>
        <p className="mt-3 max-w-[12ch] text-[22px] leading-[0.95] tracking-[-0.04em] desk:text-[32px]">
          {title}
        </p>
      </div>
    </article>
  );
}

function TeamMember({
  photo,
  name,
  role,
}: {
  photo: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex w-[108px] flex-col items-center gap-3 desk:w-[160px]">
      <div className="relative size-[108px] overflow-hidden rounded-full desk:size-[160px]">
        <Image src={photo} alt="" fill className="object-cover" sizes="160px" />
      </div>
      <div className="text-center text-white">
        <p className="text-[14px] leading-none tracking-[-0.04em] desk:text-[20px]">{name}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60 desk:text-[12px]">
          {role}
        </p>
      </div>
    </div>
  );
}

export function AboutPage() {
  const copy = useCopy();
  const a = copy.aboutUs;
  const [first, second, third, ...rest] = aboutTeamPhotos;

  return (
    <div className="overflow-x-hidden bg-cream">
      <section className="relative flex min-h-[820px] items-center justify-center overflow-hidden px-5 pb-24 pt-28 desk:min-h-[960px] desk:px-16 desk:pb-32 desk:pt-32">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 55% 48% at 50% 42%, rgba(98, 78, 255, 0.72) 0%, rgba(196, 75, 212, 0.2) 42%, transparent 68%), linear-gradient(180deg, #ff4d9a 0%, #d24ad8 34%, #7d6cff 68%, #f7b7d4 100%)",
          }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-cream desk:h-36" />
        <div className="relative z-10 flex w-full max-w-[760px] flex-col items-center">
          <div className="relative flex items-center justify-center">
            <FaceGlobe />
            <h1
              className={`${trail.className} absolute left-1/2 top-1/2 w-[8ch] -translate-x-1/2 -translate-y-1/2 text-center text-[clamp(64px,16vw,112px)] uppercase leading-[0.82] tracking-[0.04em] text-white`}
            >
              {a.heroTitle}
            </h1>
          </div>
          <p className="relative z-10 -mt-2 max-w-[560px] text-center text-[16px] leading-[1.15] tracking-[-0.03em] text-white desk:text-[22px]">
            {a.heroBody}
          </p>
        </div>
      </section>

      <section className="relative z-10 flex items-center justify-center px-5 py-20 desk:min-h-[640px] desk:px-16 desk:py-28">
        <div className="flex max-w-[640px] flex-col gap-8 desk:gap-12">
          <p className="whitespace-pre-line text-[28px] leading-[1.05] tracking-[-0.04em] text-black desk:text-[48px] desk:leading-[0.98]">
            {a.statement}
          </p>
          <p className="text-[18px] leading-[1.15] tracking-[-0.03em] text-black desk:text-[28px]">
            {a.statementTag}
          </p>
        </div>
      </section>

      <section className="bg-black px-5 py-16 text-white desk:px-16 desk:py-24">
        <div className="mx-auto flex max-w-[760px] flex-col gap-10 desk:gap-14">
          <div className="flex flex-col gap-6">
            <h2 className="text-[32px] leading-[0.9] tracking-[-0.04em] desk:text-[48px]">
              {a.whatTitle}
            </h2>
            <p className="max-w-[640px] text-[16px] leading-[1.25] tracking-[-0.03em] text-white/90 desk:text-[22px]">
              {a.whatBody}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 desk:gap-4">
            <WorkCard
              label={a.cards[0].label}
              title={a.cards[0].title}
              className="bg-[#f6f3ec]"
              titleClass="text-black"
            >
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute left-[8%] top-[34%] h-[58%] w-[78%] rounded-[50%] border border-black/15" />
                <div className="absolute left-[18%] top-[22%] size-[62%] rounded-full border border-black/10" />
                <div className="absolute bottom-[16%] left-[22%] h-[46%] w-[70%] rotate-[-16deg] rounded-[50%] border border-black/10" />
                <div className="absolute right-[14%] top-[18%] size-[22%] overflow-hidden rounded-full">
                  <Image src="/images/platform-globe-static.png" alt="" fill className="object-cover" sizes="80px" />
                </div>
                <PhotoPin
                  src={aboutTeamPhotos[1]}
                  clipId="about-platform-pin"
                  className="absolute bottom-[8%] left-[14%] w-[16%] drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)]"
                />
              </div>
            </WorkCard>

            <WorkCard
              label={a.cards[1].label}
              title={a.cards[1].title}
              className="bg-[linear-gradient(145deg,#dce85a_0%,#f08ad0_58%,#ec268f_100%)]"
              titleClass="text-black"
            >
              <span
                aria-hidden
                className={`${trail.className} pointer-events-none absolute -right-[18%] top-[8%] text-[clamp(88px,12vw,150px)] uppercase leading-[0.75] tracking-[0.02em] text-magenta`}
              >
                Home
              </span>
            </WorkCard>

            <WorkCard
              label={a.cards[2].label}
              title={a.cards[2].title}
              className="bg-magenta"
              titleClass="text-white"
            >
              <div aria-hidden className="absolute bottom-4 left-4 flex desk:bottom-6 desk:left-6">
                <span className="relative size-12 overflow-hidden rounded-full ring-2 ring-white desk:size-16">
                  <Image src={aboutTeamPhotos[0]} alt="" fill className="object-cover" sizes="64px" />
                </span>
                <span className="relative -ml-3 size-12 overflow-hidden rounded-full ring-2 ring-white desk:size-16">
                  <Image src={aboutTeamPhotos[4]} alt="" fill className="object-cover" sizes="64px" />
                </span>
              </div>
            </WorkCard>

            <WorkCard
              label={a.cards[3].label}
              title={a.cards[3].title}
              className="bg-[linear-gradient(160deg,#e7f26a_0%,#d2de38_55%,#c5d84a_100%)]"
              titleClass="text-black"
            >
              <PhotoPin
                src="/images/pavilion-expo.jpg"
                clipId="about-pavilion-pin"
                className="pointer-events-none absolute bottom-[12%] right-[10%] w-[34%] drop-shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
              />
            </WorkCard>
          </div>
        </div>

        <div className="mx-auto mt-16 flex max-w-[1072px] flex-col items-center gap-6 desk:mt-24 desk:gap-8">
          <div className="relative w-full overflow-hidden rounded-[36px] desk:rounded-[48px]">
            <div className="grid h-[220px] grid-cols-4 desk:h-[360px]">
              {HOME_STILLS.map((photo) => (
                <div key={photo} className="relative">
                  <Image src={photo} alt="" fill className="object-cover" sizes="25vw" />
                </div>
              ))}
            </div>
            <div aria-hidden className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-x-0 top-0 grid grid-cols-4">
              {a.homeTopics.map((topic) => (
                <p
                  key={topic}
                  className="px-3 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white desk:px-5 desk:pt-5 desk:text-[13px]"
                >
                  {topic}
                </p>
              ))}
            </div>
            <p
              aria-hidden
              className={`${trail.className} pointer-events-none absolute left-1/2 top-1/2 w-[120%] -translate-x-1/2 -translate-y-1/2 text-center text-[clamp(92px,22vw,240px)] uppercase leading-[0.7] tracking-[0.02em] text-magenta`}
            >
              Home
            </p>
          </div>
          <p className="max-w-[720px] text-center text-[16px] leading-[1.15] tracking-[-0.03em] desk:text-[28px]">
            {copy.content.homeCaption}
          </p>
        </div>
      </section>

      <section className="bg-black px-5 pb-20 pt-8 text-white desk:px-16 desk:pb-28 desk:pt-12">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-10 desk:gap-14">
          <h2 className="text-[32px] leading-[0.9] tracking-[-0.04em] desk:text-[48px]">{a.teamTitle}</h2>

          <div className="flex flex-col items-center gap-8 desk:gap-10">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-8 desk:gap-x-8">
              <TeamMember photo={first} name={a.memberName} role={a.memberRole} />
              <TeamMember photo={second} name={a.memberName} role={a.memberRole} />
              <p className="w-[min(100%,280px)] text-center text-[14px] leading-[1.25] tracking-[-0.03em] text-white desk:w-[260px] desk:text-left desk:text-[18px]">
                {a.teamQuote}
              </p>
              <TeamMember photo={third} name={a.memberName} role={a.memberRole} />
            </div>

            <div className="flex max-w-[560px] flex-wrap justify-center gap-x-4 gap-y-8 desk:max-w-[720px] desk:gap-x-8">
              {rest.map((photo) => (
                <TeamMember key={photo} photo={photo} name={a.memberName} role={a.memberRole} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
