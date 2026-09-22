"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { programIcons, programPhotos } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { FigmaImg } from "./FigmaImg";

type AboutProgramPopupProps = {
  open: boolean;
  onClose: () => void;
};

function Glow({
  src,
  className,
  insetClass = "inset-[-35.72%_-31.45%]",
  width,
  height,
}: {
  src: string;
  className: string;
  insetClass?: string;
  width: number;
  height: number;
}) {
  return (
    <span className={`pointer-events-none block ${className}`}>
      <span className={`absolute ${insetClass}`}>
        <FigmaImg
          src={src}
          alt=""
          width={width}
          height={height}
          className="block size-full max-w-none"
        />
      </span>
    </span>
  );
}

function Tile({
  bg,
  textClass,
  align = "center",
  glow,
  badge,
  children,
}: {
  bg: string;
  textClass: string;
  align?: "center" | "start";
  glow: ReactNode;
  badge?: ReactNode;
  children: string;
}) {
  return (
    <div
      className={`relative flex aspect-square flex-1 flex-col justify-center gap-6 overflow-hidden rounded-[64px] p-8 ${
        align === "start" ? "items-start" : "items-center"
      } ${bg}`}
    >
      {glow}
      {badge}
      <p
        className={`relative min-w-full text-[20px] font-normal leading-[1.2] tracking-[-0.8px] ${textClass}`}
      >
        {children}
      </p>
    </div>
  );
}

function BlueZoneBadge({ label }: { label: string }) {
  return (
    <span className="absolute left-8 top-[35px] z-10 flex h-[31px] w-[82px] items-center justify-center overflow-hidden rounded-[8.41px] bg-[#3dadff]">
      <FigmaImg
        src={programPhotos.blueZone}
        alt=""
        width={82}
        height={31}
        className="absolute inset-0 size-full object-cover opacity-64"
      />
      <span className="relative text-[10.513px] font-semibold uppercase leading-[0.79] tracking-[0.841px] text-white">
        {label}
      </span>
    </span>
  );
}

function Lead({ icon, children }: { icon: string; children: string }) {
  return (
    <div className="flex w-full items-center gap-2.5 px-8">
      <FigmaImg src={icon} alt="" width={24} height={24} className="size-6 shrink-0" />
      <p className="text-[20px] font-normal leading-[1.2] tracking-[-0.8px] text-black">
        {children}
      </p>
    </div>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <div className="flex w-full items-center gap-4">
      <span aria-hidden className="size-2 shrink-0 rounded-full bg-black/40" />
      <p className="min-w-0 flex-1 text-[20px] font-normal leading-[1.2] tracking-[-0.8px] text-black/84">
        {children}
      </p>
    </div>
  );
}

function useFitScale(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!open) return;
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const scale = height > 0 ? Math.min(1, window.innerHeight / height) : 1;
      setFit((prev) =>
        prev.scale === scale && prev.width === width && prev.height === height
          ? prev
          : { scale, width, height },
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return { ref, fit };
}

export function AboutProgramPopup({ open, onClose }: AboutProgramPopupProps) {
  const copy = useCopy();
  const about = copy.programs.aboutPopup;
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { ref: panelRef, fit } = useFitScale(open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const scaled = fit.height > 0 && fit.scale < 1;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-end overflow-hidden">
      <button
        type="button"
        aria-label={copy.a11y.closeAboutProgram}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        className="relative z-10 overflow-hidden"
        style={
          scaled
            ? { width: fit.width * fit.scale, height: fit.height * fit.scale }
            : undefined
        }
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="flex w-screen flex-col bg-white desk:w-[590px]"
          style={
            scaled
              ? { transform: `scale(${fit.scale})`, transformOrigin: "top left" }
              : undefined
          }
        >
          <div className="relative flex h-[88px] w-full shrink-0 items-center p-2">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={copy.a11y.closeAboutProgram}
            className="relative z-10 flex size-[72px] shrink-0 items-center justify-center rounded-full bg-white"
          >
            <FigmaImg
              src={programIcons.arrowLeft}
              alt=""
              width={24}
              height={24}
              className="size-6 brightness-0"
            />
          </button>
          <h2
            id={titleId}
            className="pointer-events-none absolute inset-x-0 text-center text-[28px] font-normal leading-[0.9] tracking-[-1.28px] text-black desk:text-[32px]"
          >
            {about.title}
          </h2>
        </div>

        <div className="flex flex-col items-center gap-4 pb-6 pt-3">
          <Lead icon={programIcons.laptop}>{about.sessionsLead}</Lead>

          <div className="flex w-full items-center">
            <Tile
              bg="bg-black"
              textClass="text-white"
              glow={
                <span className="pointer-events-none absolute left-[-123px] top-[2px] flex size-[390.91px] items-center justify-center">
                  <span className="-rotate-[135deg]">
                    <Glow
                      src={programIcons.aboutEllipse17}
                      className="relative h-[258.83px] w-[294px]"
                      width={479}
                      height={444}
                    />
                  </span>
                </span>
              }
            >
              {about.sessions[0]}
            </Tile>
            <Tile
              bg="bg-magenta"
              textClass="text-white"
              glow={
                <Glow
                  src={programIcons.aboutEllipse18}
                  className="absolute left-[-57.67px] top-[-130px] h-[258.83px] w-[294px]"
                  width={479}
                  height={444}
                />
              }
            >
              {about.sessions[1]}
            </Tile>
            <Tile
              bg="bg-lime"
              textClass="text-black"
              glow={
                <Glow
                  src={programIcons.aboutEllipse19}
                  className="absolute left-[31.67px] top-[34px] h-[214.5px] w-[284.68px]"
                  insetClass="inset-[-38.56%_-29.05%]"
                  width={450}
                  height={380}
                />
              }
            >
              {about.sessions[2]}
            </Tile>
          </div>

          <Lead icon={programIcons.airplaneTakeoff}>{about.antalyaLead}</Lead>

          <div className="flex w-full items-center">
            <Tile
              bg="bg-orange"
              textClass="text-black"
              glow={
                <span className="pointer-events-none absolute left-3 top-[53.33px] flex h-[252.5px] w-[286.81px] items-center justify-center">
                  <span className="rotate-180">
                    <Glow
                      src={programIcons.aboutEllipse20}
                      className="relative h-[252.5px] w-[286.81px]"
                      width={467}
                      height={433}
                    />
                  </span>
                </span>
              }
            >
              {about.antalya[0]}
            </Tile>
            <Tile
              bg="bg-black"
              textClass="text-white"
              glow={
                <span className="pointer-events-none absolute left-[-110.67px] top-[-95.67px] flex h-[252.5px] w-[286.81px] items-center justify-center">
                  <span className="-scale-y-100">
                    <Glow
                      src={programIcons.aboutEllipse21}
                      className="relative h-[252.5px] w-[286.81px]"
                      width={467}
                      height={433}
                    />
                  </span>
                </span>
              }
            >
              {about.antalya[1]}
            </Tile>
            <Tile
              bg="bg-magenta"
              textClass="text-white"
              align="start"
              badge={<BlueZoneBadge label={about.blueZone} />}
              glow={
                <span className="pointer-events-none absolute left-[-21.33px] top-[-98.67px] flex h-[384px] w-[371px] items-center justify-center">
                  <span className="rotate-[120deg]">
                    <Glow
                      src={programIcons.aboutEllipse22}
                      className="relative h-[258.83px] w-[294px]"
                      width={479}
                      height={444}
                    />
                  </span>
                </span>
              }
            >
              {about.antalya[2]}
            </Tile>
          </div>

          <p className="w-full px-8 text-[20px] font-normal leading-[1.2] tracking-[-0.8px] text-black">
            {about.alsoLead}
          </p>

          <div className="flex w-full gap-3 px-8">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <Bullet>{about.also[0]}</Bullet>
              <Bullet>{about.also[1]}</Bullet>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <Bullet>{about.also[2]}</Bullet>
              <Bullet>{about.also[3]}</Bullet>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
