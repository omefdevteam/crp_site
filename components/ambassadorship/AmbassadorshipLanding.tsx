"use client";

import Image from "next/image";
import Link from "@/components/LocaleLink";
import { trail } from "@/lib/fonts";
import { fitVars } from "@/lib/fitSize";
import { useFitText } from "@/lib/useFitText";
import { Fragment } from "react";
import { useCopy } from "../LanguageProvider";
import { TicketTab } from "../TicketTab";
import { BAR, LABEL } from "../programs/ProgramApplyBar";
import { ApplyFooter, ApplyHeader } from "./ApplyChrome";
import { useConsent } from "../cookies/ConsentProvider";

const ART = "/images/apply/ambassadorship";

// Shield, calendar, shield (Figma 38:941).
const FACT_ICONS = ["/icons/apply/shield-check.svg", "/icons/apply/calendar-blank.svg", "/icons/apply/shield-check.svg"];

type Glow = {
  src: string;
  /** Outer box (Figma's flex wrapper), px from the card's top left. */
  box: { left: number; top: number; width: number; height: number };
  /** CSS transform of the 284.68×214.5 ellipse inside the box. */
  transform?: string;
};

const ELLIPSE = { width: 284.68, height: 214.5 };

// Figma 37:777 program cards, left to right. Phones reuse the same offsets on the
// 147px cards, except Content Missions, which has its own smaller glow (55:135).
const PROGRAMS: readonly { image: string; glow: Glow; mobileGlow?: Glow; soon: boolean }[] = [
  {
    image: `${ART}/card-ambassador-101.jpg`,
    glow: { src: `${ART}/glow-17.svg`, box: { left: 96, top: -55, ...ELLIPSE } },
    soon: false,
  },
  {
    image: `${ART}/card-unfccc-101.jpg`,
    glow: {
      src: `${ART}/glow-18.svg`,
      box: { left: 162, top: 79, width: 356.44, height: 343.118 },
      transform: "rotate(-142.71deg)",
    },
    soon: true,
  },
  {
    image: `${ART}/card-cop.jpg`,
    glow: {
      src: `${ART}/glow-19.svg`,
      box: { left: -146, top: 121, width: 356.44, height: 343.118 },
      transform: "scaleY(-1) rotate(-37.29deg)",
    },
    soon: true,
  },
  {
    image: `${ART}/card-content-missions.jpg`,
    glow: {
      src: `${ART}/glow-20.svg`,
      box: { left: -95, top: -117, width: 356.44, height: 343.118 },
      transform: "scaleY(-1) rotate(-37.29deg)",
    },
    mobileGlow: {
      src: `${ART}/glow-20-mobile.svg`,
      box: { left: 30.89, top: -37.5, width: 174.65, height: 168.122 },
      transform: "scaleY(-1) rotate(-37.29deg) scale(0.49)",
    },
    soon: true,
  },
];

function GlowArt({ glow, className = "" }: { glow: Glow; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute flex items-center justify-center ${className}`}
      style={{ left: glow.box.left, top: glow.box.top, width: glow.box.width, height: glow.box.height }}
    >
      <div className="relative flex-none" style={{ ...ELLIPSE, transform: glow.transform }}>
        <span className="absolute inset-[-38.56%_-29.05%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={glow.src} alt="" className="block size-full max-w-none" />
        </span>
      </div>
    </div>
  );
}

function ProgramCard({
  index,
  tag,
  title,
  comingSoon,
}: {
  index: number;
  tag: string;
  title: string;
  comingSoon: string;
}) {
  const program = PROGRAMS[index];
  const first = index === 0;
  // Content Missions' tag is white on desktop but lime on phones (Figma 37:777 vs 55:135).
  const tagTone = index === 3 ? "text-lime desk:text-white" : "text-lime";
  return (
    <div
      className={`relative flex size-[147px] shrink-0 flex-col overflow-clip rounded-[24px] p-3 desk:aspect-square desk:size-auto desk:min-w-0 desk:flex-1 desk:rounded-[64px] desk:p-8 ${
        first ? "justify-between" : "justify-end gap-6"
      }`}
    >
      <Image
        src={program.image}
        alt=""
        fill
        sizes="(min-width: 900px) 340px, 147px"
        className="pointer-events-none object-cover"
      />
      {program.mobileGlow ? (
        <>
          <GlowArt glow={program.mobileGlow} className="desk:hidden" />
          <GlowArt glow={program.glow} className="hidden desk:flex" />
        </>
      ) : (
        <GlowArt glow={program.glow} />
      )}
      {tag ? (
        <p
          className={`relative text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.96px] desk:text-[16px] desk:tracking-[1.28px] ${tagTone}`}
        >
          {tag}
        </p>
      ) : null}
      {/* Desktop titles may run into the right padding, as Figma's fixed 222-229px title boxes do. */}
      <p className="relative text-[20px] leading-[0.9] tracking-[-0.8px] text-white desk:-mr-6 desk:text-[32px] desk:tracking-[-1.28px] [overflow-wrap:anywhere]">
        {/* Inclusive forms ("Ambassadeur·rice") may break after the middle dot on narrow cards. */}
        {title.split("·").map((part, i) => (
          <Fragment key={`${part}-${i}`}>
            {i > 0 ? "·" : null}
            {i > 0 ? <wbr /> : null}
            {part}
          </Fragment>
        ))}
      </p>
      {program.soon ? (
        <TicketTab
          placement="top"
          ink
          label={
            <>
              {/* Phones stack the words (Figma 55:135); desktop keeps one line. */}
              <span className="block text-[12px] leading-[1.1] desk:hidden">
                {comingSoon.split(" ").map((word, i) => (
                  <span key={`${word}-${i}`} className="block">
                    {word}
                  </span>
                ))}
              </span>
              <span className="hidden desk:inline">{comingSoon}</span>
            </>
          }
        />
      ) : null}
    </div>
  );
}

/** "Earn your badges" heading and the four program cards (Figma 37:777, 55:135). */
function ProgramsBlock({ className }: { className: string }) {
  const a = useCopy().apply;
  return (
    <div className={`flex-col gap-8 ${className}`}>
      <h2 className="text-center text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.96px] text-white [text-shadow:0_0_4px_rgba(0,0,0,0.25)] desk:text-[16px] desk:tracking-[1.28px]">
        {a.programsHeading}
      </h2>
      {/* Phones: a row that scrolls out to the screen edge (Figma lets it run off the frame). */}
      <div className="no-scrollbar -mr-12 flex overflow-x-auto pr-12 desk:mr-0 desk:overflow-visible desk:pr-0">
        {a.programs.map((program, i) => (
          <ProgramCard key={program.title} index={i} tag={program.tag} title={program.title} comingSoon={a.comingSoon} />
        ))}
      </div>
    </div>
  );
}

/**
 * Entry page for both paths (Figma 37:777 desktop, 55:135 phones). /apply and
 * /nominate share it; only the "View details" link differs, so /programs knows
 * which bar to show. Prerendered: nothing here reads cookies or the session.
 */
export function AmbassadorshipLanding({ intent }: { intent: "apply" | "nominate" }) {
  const copy = useCopy();
  const a = copy.apply;
  const titleRef = useFitText<HTMLHeadingElement>(a.title);
  const { bannerVisible } = useConsent();

  return (
    <div className="relative bg-cream">
      {/*
        Fixed frame (Figma 37:777 / 55:135, image 55:3): the nav, the photo and the curved
        bottom corners stay put while the page content scrolls over the photo. The frame is
        position: sticky inside this section, so once the content ends it lets go and scrolls
        up with the page to reveal the footer. Pure CSS: the page itself scrolls (no inner
        scroll box), and nothing here depends on the request.
      */}
      <section className="relative isolate">
        {/* Back layer: the photo. */}
        <div className="apply-frame sticky top-0 bg-[#04121a]">
          <Image
            src={`${ART}/hero.jpg`}
            alt=""
            fill
            priority
            sizes="100vw"
            className="pointer-events-none object-cover desk:object-bottom"
          />
        </div>
        {/* Front layer: the nav, and the cream outside the curved bottom corners, so the content scrolls under both. */}
        <div className="apply-frame pointer-events-none sticky top-0 z-20">
          <div className="pointer-events-auto">
            <ApplyHeader />
          </div>
          <div aria-hidden className="absolute inset-x-0 bottom-0 flex justify-between">
            <span className="apply-frame-corner apply-frame-corner--left" />
            <span className="apply-frame-corner apply-frame-corner--right" />
          </div>
        </div>

        {/* Not a stacking context, so the title's overlay blend still mixes with the photo. */}
        <div className="apply-frame-content relative px-6 desk:px-0 desk:pt-[120px]">
          <div className="relative mx-auto flex w-full max-w-[1200px] flex-col desk:gap-16 desk:p-16">
            {/* Title; the subtitle sits over it (Figma 37:905). */}
            <div className="relative flex flex-col items-center pb-8 pt-24 text-white desk:p-0">
              <h1
                ref={titleRef}
                className={`${trail.className} w-full text-[82.08px] uppercase leading-[0.9] tracking-[-3.28px] mix-blend-overlay [overflow-wrap:anywhere] desk:fit-text desk:text-center desk:[--fit-max:130px] desk:[--fit-room:min(1072px,100vw-128px)] desk:[--fit-track-px:-5.2px] desk:tracking-[-5.2px] desk:[overflow-wrap:normal]`}
                style={fitVars(a.title, "trail", { upper: true })}
              >
                {a.title}
              </h1>
              <p className="absolute left-0 top-[144px] w-[246px] text-[20px] leading-none tracking-[-0.8px] desk:left-16 desk:top-[calc(50%-11.5px)] desk:w-auto desk:max-w-[1072px] desk:text-[24px] desk:leading-[0.9] desk:tracking-[-0.96px]">
                {a.subtitle}
              </p>
            </div>

            <ul className="flex flex-col gap-8 pb-8 desk:flex-row desk:gap-8 desk:px-16 desk:pb-0">
              {a.facts.map((fact, i) => (
                <li key={fact} className="flex min-w-0 items-center gap-4 desk:flex-1 desk:flex-col desk:items-start">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white p-1 desk:size-12 desk:p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={FACT_ICONS[i] ?? FACT_ICONS[0]} alt="" width={24} height={24} className="size-4 desk:size-6" />
                  </span>
                  <p className="min-w-0 flex-1 text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.96px] text-white desk:text-[16px] desk:tracking-[1.28px]">
                    {fact.split("\n").map((line, j) => (
                      <span key={`${line}-${j}`}>
                        {j > 0 ? (
                          <>
                            <span className="desk:hidden"> </span>
                            <br className="max-desk:hidden" />
                          </>
                        ) : null}
                        {line}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>

            {/* Glass panel; on phones the programs sit inside it (Figma 55:135). */}
            <div className="flex flex-col gap-8 desk:contents">
              <div className="flex flex-col gap-8 rounded-[64px] bg-black/48 px-6 py-12 backdrop-blur-[32px] desk:rounded-[90px] desk:p-16">
                <div className="flex flex-col gap-2.5 text-white desk:flex-row">
                  <p className="text-[20px] leading-[0.9] tracking-[-0.8px] desk:min-w-0 desk:flex-1 desk:text-[32px] desk:tracking-[-1.28px]">
                    {a.headline}
                  </p>
                  <p className="text-[15px] leading-[1.2] tracking-[-0.6px] desk:min-w-0 desk:flex-1 desk:text-[20px] desk:tracking-[-0.8px]">
                    {a.body}
                  </p>
                  <ul className="grid grid-cols-2 desk:hidden">
                    {a.journey.map((step) => (
                      <li key={step} className="flex min-h-[147px] items-end rounded-[24px] bg-black p-6">
                        <p className="min-w-0 text-[15px] leading-[1.2] tracking-[-0.6px] text-white">{step}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <ul className="hidden min-h-[236px] desk:flex">
                  {a.journey.map((step) => (
                    <li key={step} className="flex min-w-0 flex-1 items-end rounded-[32px] bg-black p-8">
                      <p className="min-w-0 text-[20px] leading-[1.2] tracking-[-0.8px] text-white">{step}</p>
                    </li>
                  ))}
                </ul>

                <ProgramsBlock className="flex desk:hidden" />
              </div>
              <ProgramsBlock className="hidden desk:flex" />
            </div>
          </div>
        </div>
      </section>

      <ApplyFooter />
      {/* Room for the pinned bar, so it never covers the copyright line. */}
      <div aria-hidden className="h-[calc(5.5rem+env(safe-area-inset-bottom))] desk:h-[calc(6.25rem+env(safe-area-inset-bottom))]" />

      <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] desk:px-[10px] desk:pt-[10px] desk:pb-[max(10px,env(safe-area-inset-bottom))] ${bannerVisible ? "hidden" : "flex"}`}>
        <Link href={`/programs?intent=${intent}`} className={BAR}>
          <span className={LABEL}>{a.viewDetails}</span>
        </Link>
      </div>
    </div>
  );

}
