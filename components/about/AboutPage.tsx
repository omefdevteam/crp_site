"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useCopy } from "../LanguageProvider";
import { TicketTab } from "../TicketTab";
import { trail } from "@/lib/fonts";
import { aboutImages, aboutTeamPhotos } from "@/lib/about-assets";
import type { Pin } from "@/lib/pins";
import { PlatformGlobe } from "../platform/PlatformGlobe";

function FitWidth({
  designWidth,
  designHeight,
  cap = false,
  className = "",
  children,
}: {
  designWidth: number;
  designHeight: number;
  cap?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const next = el.clientWidth / designWidth;
      setScale(cap ? Math.min(1, next) : next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth, cap]);

  return (
    <div
      ref={ref}
      className={`relative w-full ${className}`}
      style={{ height: designHeight * scale }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Glow({
  src,
  className,
  inset,
}: {
  src: string;
  className: string;
  inset: string;
}) {
  return (
    <div aria-hidden className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src={src} className="absolute max-w-none" style={{ inset }} />
    </div>
  );
}

function GlassOrb({
  icon,
  pad,
  blur,
  opacity = 1,
  className,
}: {
  icon: string;
  pad: number;
  blur?: number;
  opacity?: number;
  className: string;
}) {
  return (
    <div
      aria-hidden
      className={`absolute flex items-center rounded-full border-solid border-white/72 ${className}`}
      style={{
        padding: pad,
        opacity,
        borderWidth: pad / 16,
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
    >
      <div
        className="absolute inset-0 rounded-full bg-black/64"
        style={{ backdropFilter: `blur(${pad * 0.75}px)` }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src={icon} className="relative size-full" style={{ width: pad, height: pad }} />
    </div>
  );
}

function WorkLabel({ children, className }: { children: string; className?: string }) {
  return (
    <p
      className={`relative z-10 min-w-full text-[16px] font-semibold uppercase leading-[0.9] tracking-[1.28px] ${className ?? "text-black"}`}
    >
      {children}
    </p>
  );
}

function WorkTitle({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      className={`relative z-10 text-[32px] font-normal leading-none tracking-[-1.28px] ${className ?? "text-black"}`}
    >
      {children}
    </p>
  );
}

function TeamCard({
  photo,
  name,
  role,
  expand,
}: {
  photo: string;
  name: string;
  role: string;
  expand?: "left" | "lead" | "right";
}) {
  const wide =
    expand === "left" ? "group-hover/left:w-[320px]" : expand === "lead" ? "group-hover/lead:w-[320px]" : expand === "right" ? "group-hover/right:w-[320px]" : "";
  const clear =
    expand === "left" ? "group-hover/left:opacity-0" : expand === "lead" ? "group-hover/lead:opacity-0" : expand === "right" ? "group-hover/right:opacity-0" : "";

  return (
    <article
      className={`relative h-[200px] w-[200px] shrink-0 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${wide}`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[64px]">
        <Image src={photo} alt="" fill className="object-cover" sizes="320px" />
        <div className={`absolute inset-0 bg-black/48 transition-opacity duration-500 ${clear}`} />
        <p className="absolute bottom-6 left-0 right-0 px-8 text-center text-[24px] leading-none tracking-[-0.96px] text-white">
          {name}
        </p>
      </div>
      <TicketTab placement="top" ink label={role} />
    </article>
  );
}

const TEAM_SEATS = ["left", "lead", "right"] as const;

function TeamRow({
  photos,
  quotes,
  name,
  role,
}: {
  photos: readonly string[];
  quotes: readonly string[];
  name: string;
  role: string;
}) {
  return (
    <div className="flex w-full items-center justify-center">
      {TEAM_SEATS.map((seat, index) => {
        const photo = photos[index];
        if (!photo) return null;
        const groupClass = seat === "left" ? "group/left" : seat === "lead" ? "group/lead" : "group/right";
        return (
          <div key={photo} className={`${groupClass} flex items-center`}>
            <TeamCard expand={seat} photo={photo} name={name} role={role} />
            <TeamQuote group={seat} quote={quotes[index] ?? ""} />
          </div>
        );
      })}
    </div>
  );
}

function TeamQuote({ quote, group }: { quote: string; group: "left" | "lead" | "right" }) {
  const open =
    group === "left" ? "group-hover/left:w-[280px]" : group === "lead" ? "group-hover/lead:w-[280px]" : "group-hover/right:w-[280px]";
  const shown =
    group === "left"
      ? "group-hover/left:translate-x-0 group-hover/left:opacity-100"
      : group === "lead"
        ? "group-hover/lead:translate-x-0 group-hover/lead:opacity-100"
        : "group-hover/right:translate-x-0 group-hover/right:opacity-100";

  return (
    <div className={`w-0 overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open}`}>
      <p className={`w-[280px] -translate-x-8 p-8 text-[20px] leading-[1.2] tracking-[-0.8px] text-white opacity-0 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${shown}`}>
        {quote}
      </p>
    </div>
  );
}

export function AboutPage() {
  const copy = useCopy();
  const a = copy.aboutUs;
  const statementLines = a.statement.split("\n");
  const teamPins: Pin[] = aboutTeamPhotos.map((image, index) => {
    const band = (index + 0.5) / aboutTeamPhotos.length;
    return {
      id: `team-${index + 1}`,
      kind: "photo",
      group: "ambassadors",
      city: a.memberName,
      lat: Math.asin(1 - 2 * band) * (180 / Math.PI) * 0.72,
      lng: ((index * 137.508) % 360) - 180,
      image,
    };
  });
  const teamRows: { photos: string[]; quotes: string[] }[] = [];
  for (let i = 0; i < aboutTeamPhotos.length; i += 3) {
    teamRows.push({
      photos: aboutTeamPhotos.slice(i, i + 3),
      quotes: [0, 1, 2].map((offset) => a.teamQuotes[i + offset] ?? a.teamQuotes[(i + offset) % a.teamQuotes.length] ?? ""),
    });
  }

  return (
    <div className="overflow-x-hidden bg-cream">
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 pb-16 pt-28 desk:min-h-[805px] desk:px-16 desk:pb-[96px] desk:pt-[120px]">
        <Image
          src={aboutImages.heroBg}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="relative z-10 flex min-h-[520px] w-full flex-col items-center justify-between text-white desk:min-h-[589px]">
          <h1
            className={`${trail.className} text-center text-[clamp(64px,14vw,130px)] uppercase leading-[0.9] tracking-[0.04em] desk:tracking-[5.2px]`}
          >
            {a.heroTitle}
          </h1>
          <p className="max-w-[632px] text-center text-[18px] leading-[0.9] tracking-[-0.72px] desk:text-[32px] desk:tracking-[-1.28px]">
            {a.heroBody}
          </p>
        </div>
        <div className="absolute left-1/2 top-[calc(50%-38.5px)] z-20 aspect-square w-[min(407px,78vw)] -translate-x-1/2 -translate-y-1/2">
          <PlatformGlobe visibleGroups={["ambassadors"]} emphasis={null} pins={teamPins} />
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-20 desk:h-[805px] desk:px-16 desk:py-24">
        <div className="flex w-full max-w-[632px] flex-col gap-12">
          <div className="text-[28px] leading-[0.9] tracking-[-0.04em] text-black desk:text-[48px] desk:tracking-[-1.92px]">
            {statementLines.map((line, i) => (
              <p
                key={line}
                className={i < statementLines.length - 1 ? "mb-3" : undefined}
              >
                {line}
              </p>
            ))}
          </div>
          <p className="text-[18px] leading-[0.9] tracking-[-0.04em] text-black desk:text-[32px] desk:tracking-[-1.28px]">
            {a.statementTag}
          </p>
        </div>
      </section>

      <section
        data-nav-tone="dark"
        className="bg-black px-5 py-16 text-white desk:px-16 desk:py-24"
      >
        <div className="mx-auto flex w-full max-w-[632px] flex-col gap-8 desk:gap-16">
          <div className="flex flex-col gap-8">
            <h2 className="text-[32px] leading-[0.9] tracking-[-0.04em] desk:text-[48px] desk:tracking-[-1.92px]">
              {a.whatTitle}
            </h2>
            <p className="text-[16px] leading-none tracking-[-0.04em] desk:text-[32px] desk:tracking-[-1.28px]">
              {a.whatBody}
            </p>
          </div>

          <FitWidth designWidth={632} designHeight={632} cap>
            <div className="grid size-[632px] grid-cols-2">
              <article className="relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-[64px] bg-white p-8">
                <Glow
                  src={aboutImages.workGlow}
                  className="absolute left-[85px] top-[-115px] h-[252.5px] w-[286.81px] rotate-180"
                  inset="-35.72% -31.45%"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  src={aboutImages.workRings}
                  className="pointer-events-none absolute right-[51px] top-1/2 size-[292px] -translate-y-1/2"
                />
                <WorkLabel>{a.cards[0].label}</WorkLabel>
                <WorkTitle className="w-[252px] text-black">{a.cards[0].title}</WorkTitle>
                <GlassOrb
                  icon={aboutImages.iconPin}
                  pad={20.48}
                  blur={4}
                  opacity={0.72}
                  className="left-[60px] top-[-11px]"
                />
                <GlassOrb
                  icon={aboutImages.iconUser}
                  pad={30.72}
                  blur={1.6}
                  opacity={0.8}
                  className="left-[217px] top-1/2 -translate-y-1/2"
                />
                <GlassOrb
                  icon={aboutImages.iconCrosshair}
                  pad={38.4}
                  className="left-[32px] top-[245px]"
                />
              </article>

              <article className="relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-[64px] bg-lime p-8">
                <Glow
                  src={aboutImages.workGlowStories}
                  className="absolute left-[109px] top-[82px] h-[214.5px] w-[284.68px]"
                  inset="-38.56% -29.05%"
                />
                <p
                  aria-hidden
                  className={`${trail.className} pointer-events-none absolute left-[283.5px] top-[-1px] w-[115px] -translate-x-1/2 text-center text-[116px] uppercase leading-[0.7] tracking-[-2.32px] text-magenta mix-blend-plus-lighter`}
                >
                  HOME
                </p>
                <WorkLabel>{a.cards[1].label}</WorkLabel>
                <WorkTitle>{a.cards[1].title}</WorkTitle>
              </article>

              <article className="relative flex flex-col items-start justify-center gap-6 overflow-hidden rounded-[64px] bg-magenta p-8">
                <Glow
                  src={aboutImages.workGlowAmbassadors}
                  className="absolute left-[-39px] top-[-101px] h-[258.83px] w-[294px]"
                  inset="-35.72% -31.45%"
                />
                <WorkLabel>{a.cards[2].label}</WorkLabel>
                <div className="relative z-10 flex w-full flex-col gap-3">
                  <WorkTitle className="text-white">{a.cards[2].title}</WorkTitle>
                  <div className="absolute left-0 top-[80px] flex isolate items-center">
                    {[aboutImages.avatar1, aboutImages.avatar2, aboutImages.avatar3].map(
                      (src, i) => (
                        <span
                          key={src}
                          className={`relative size-12 overflow-hidden rounded-full border-2 border-white ${
                            i < 2 ? "-mr-[34px]" : ""
                          }`}
                          style={{ zIndex: 3 - i }}
                        >
                          <Image src={src} alt="" fill className="object-cover" sizes="48px" />
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </article>

              <article className="relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-[64px] bg-orange p-8">
                <Glow
                  src={aboutImages.workGlow}
                  className="absolute left-[103px] top-[130px] h-[252.5px] w-[286.81px] rotate-180"
                  inset="-35.72% -31.45%"
                />
                <WorkLabel>{a.cards[3].label}</WorkLabel>
                <WorkTitle>{a.cards[3].title}</WorkTitle>
                <div className="pointer-events-none absolute left-[156.68px] top-[-35px] flex size-[212.43px] items-center justify-center">
                  <div className="rotate-45">
                    <div className="relative bg-white p-[5.18px] [border-radius:1295px_1295px_0_1295px]">
                      <div className="relative size-[139.852px]">
                        <div className="absolute left-1/2 top-1/2 flex size-[197.78px] -translate-x-1/2 -translate-y-1/2 -rotate-45 items-center justify-center">
                          <Image
                            src={aboutImages.pavilionPin}
                            alt=""
                            width={140}
                            height={140}
                            className="size-[139.852px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </FitWidth>
        </div>
      </section>

      <section data-nav-tone="dark" className="bg-black">
        <FitWidth designWidth={1200} designHeight={526}>
          <div className="flex h-[526px] w-[1200px] flex-col bg-black">
            <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[52px] bg-white/12 p-2">
              <div className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-[44px] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aboutImages.homeSlide}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aboutImages.homeSlide}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 size-full object-cover blur-[16px]"
                  style={{
                    maskImage:
                      "linear-gradient(to top, #000 0%, rgb(0 0 0 / 0.55) 34%, transparent 66%)",
                    WebkitMaskImage:
                      "linear-gradient(to top, #000 0%, rgb(0 0 0 / 0.55) 34%, transparent 66%)",
                  }}
                />
                <div className="pointer-events-none absolute bottom-0 left-1/2 h-[406px] w-[1184px] -translate-x-1/2 bg-gradient-to-t from-black to-transparent" />
                <p
                  aria-hidden
                  className={`${trail.className} pointer-events-none absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 whitespace-nowrap text-center text-[450.691px] uppercase leading-[0.7] tracking-[-9.014px] text-magenta`}
                >
                  HOME
                </p>
                {[
                  { label: a.homeTopics[0], left: 135, top: 55 },
                  { label: a.homeTopics[1], left: 429, top: 122 },
                  { label: a.homeTopics[2], left: 704, top: 48 },
                  { label: a.homeTopics[3], left: 1010, top: 171 },
                ].map((topic) => (
                  <p
                    key={topic.label}
                    className="absolute z-10 whitespace-nowrap text-[20px] font-semibold uppercase leading-[0.9] tracking-[0.8px] text-white mix-blend-hard-light"
                    style={{ left: topic.left, top: topic.top }}
                  >
                    {topic.label}
                  </p>
                ))}
                <p className="absolute left-1/2 top-[377px] z-10 w-[588px] -translate-x-1/2 text-center text-[32px] leading-[0.9] tracking-[-1.28px] text-white">
                  {copy.content.homeCaption}
                </p>
              </div>
            </div>
          </div>
        </FitWidth>
      </section>

      <section
        data-nav-tone="dark"
        className="bg-black px-5 py-16 text-white desk:px-16 desk:py-24"
      >
        <h2 className="text-center text-[32px] leading-[0.9] tracking-[-0.04em] desk:text-[48px] desk:tracking-[-1.92px]">
          {a.teamTitle}
        </h2>
        <div className="mx-auto mt-12 max-w-[1000px] desk:mt-12">
          <FitWidth designWidth={1000} designHeight={1400} cap>
            <div className="flex h-[1400px] w-[1000px] flex-col items-center">
              {teamRows.map((row) => (
                <TeamRow
                  key={row.photos.join()}
                  photos={row.photos}
                  quotes={row.quotes}
                  name={a.memberName}
                  role={a.memberRole}
                />
              ))}
            </div>
          </FitWidth>
        </div>
      </section>
    </div>
  );
}
