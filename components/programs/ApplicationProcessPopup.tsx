"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { programIcons, programPhotos } from "@/lib/program-assets";
import { useCopy } from "../LanguageProvider";
import { FigmaImg } from "./FigmaImg";

const STEP_IMAGES = [
  programPhotos.process.step1,
  programPhotos.process.step2,
  programPhotos.process.step3,
  programPhotos.process.step4,
  programPhotos.process.step5,
] as const;

function Ear({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 19.125 19.125"
      preserveAspectRatio="none"
      className={`block ${className}`}
      aria-hidden
    >
      <path
        d="M0 0C0 10.5624 8.56255 19.125 19.125 19.125H0V0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhiteTicket({ label, placement }: { label: string; placement: "top" | "bottom" }) {
  const isTop = placement === "top";
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-20 flex justify-center ${
        isTop ? "-top-px" : "-bottom-px"
      }`}
    >
      <div className={`relative flex text-white ${isTop ? "items-start" : "items-end"}`}>
        <div
          className={`pointer-events-none absolute inset-x-[18px] bg-white ${
            isTop ? "top-0 h-[3px]" : "bottom-0 h-[3px]"
          }`}
        />
        <Ear
          className={`h-[19px] w-[19px] shrink-0 -mr-[2px] desk:h-[38.25px] desk:w-[38.25px] ${
            isTop ? "rotate-180" : "-scale-y-100 rotate-180"
          }`}
        />
        <div
          className={`relative z-[1] flex items-center justify-center bg-white px-[18px] text-[13.5px] font-semibold uppercase leading-[0.9] tracking-[0.64px] text-black desk:h-[65.25px] desk:px-[36px] desk:text-[16px] ${
            isTop
              ? "min-h-[33px] rounded-b-[13.5px] desk:rounded-b-[27px]"
              : "min-h-[33px] rounded-t-[13.5px] desk:rounded-t-[27px]"
          }`}
        >
          {label}
        </div>
        <Ear
          className={`h-[19px] w-[19px] shrink-0 -ml-[2px] desk:h-[38.25px] desk:w-[38.25px] ${
            isTop ? "-scale-y-100" : ""
          }`}
        />
      </div>
    </div>
  );
}

function NavRow({
  tone,
  showPrev,
  isLast,
  previousLabel,
  nextLabel,
  restartLabel,
}: {
  tone: "light" | "dark";
  showPrev: boolean;
  isLast: boolean;
  previousLabel: string;
  nextLabel: string;
  restartLabel: string;
}) {
  const text = tone === "light" ? "text-white" : "text-black";
  const iconFilter = tone === "light" ? "invert" : "";

  return (
    <div className="flex h-full w-full items-center justify-between pl-6 pr-7">
      <span
        className={`inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.96px] ${text} ${
          showPrev ? "" : "opacity-0"
        }`}
      >
        <FigmaImg
          src={programIcons.arrowLeft}
          alt=""
          width={24}
          height={24}
          className={`size-6 ${iconFilter}`}
        />
        {previousLabel}
      </span>
      <span
        className={`inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.96px] ${text}`}
      >
        {isLast ? restartLabel : nextLabel}
        <FigmaImg
          src={isLast ? programIcons.arrowClockwise : programIcons.arrowLeft}
          alt=""
          width={24}
          height={24}
          className={`size-6 ${isLast ? iconFilter : `${iconFilter} rotate-180`}`}
        />
      </span>
    </div>
  );
}

function StepBody({ text }: { text: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el) return;

    const fit = () => {
      // Prefer Figma size; step down until the copy clears the progress bar.
      let size = 20;
      el.style.fontSize = `${size}px`;
      while (size > 12 && el.scrollHeight > wrap.clientHeight) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={wrapRef} className="flex h-full min-h-0 w-full items-center overflow-hidden">
      <p
        ref={textRef}
        className="w-full font-normal leading-[1.2] tracking-[-0.8px] text-black/84"
        style={{ fontSize: 20 }}
      >
        {text}
      </p>
    </div>
  );
}

type ApplicationProcessPopupProps = {
  open: boolean;
  onClose: () => void;
};

export function ApplicationProcessPopup({ open, onClose }: ApplicationProcessPopupProps) {
  const copy = useCopy();
  const process = copy.programs.applicationProcess;
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() === true;
  const [step, setStep] = useState(0);
  const total = process.steps.length;
  const current = process.steps[step];
  const progress = (step + 1) / total;
  const isLast = step === total - 1;
  const showPrev = step > 0;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

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

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center desk:items-stretch desk:justify-end">
      <button
        type="button"
        aria-label={copy.a11y.closeApplicationProcess}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 flex h-[80dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white pt-2 outline-none desk:h-dvh desk:max-h-dvh desk:w-[590px] desk:rounded-none"
      >
        <div className="relative flex h-[72px] w-full shrink-0 items-center justify-center px-2 desk:justify-start">
          <span aria-hidden className="absolute top-1 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-black/16 desk:hidden" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={copy.a11y.closeApplicationProcess}
            className="relative z-10 hidden size-[72px] shrink-0 items-center justify-center rounded-full bg-white desk:flex"
          >
            <FigmaImg
              src={programIcons.plus}
              alt=""
              width={24}
              height={24}
              className="size-6 rotate-45"
            />
          </button>
          <h2
            id={titleId}
            className="pointer-events-none absolute inset-x-0 text-center text-[28px] font-normal leading-[0.9] tracking-[-1.28px] text-black desk:text-[32px]"
          >
            {process.title}
          </h2>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 pb-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-0 flex-1 flex-col gap-3"
            >
              <div className="relative h-[min(280px,42dvh)] w-full shrink-0 overflow-hidden rounded-[40px] desk:h-[min(472px,56dvh)] desk:rounded-[88px]">
                <FigmaImg
                  src={STEP_IMAGES[step]}
                  alt=""
                  width={590}
                  height={472}
                  className="absolute inset-0 size-full object-cover"
                />
                <WhiteTicket label={current.date} placement="top" />
                <WhiteTicket label={current.label} placement="bottom" />
                <p className="absolute bottom-8 left-6 text-[56px] font-normal leading-[0.8] tracking-[-2px] text-white desk:bottom-12 desk:left-12 desk:text-[96px] desk:tracking-[-3.84px]">
                  {step + 1}
                </p>
              </div>

              <div className="flex min-h-0 flex-1 items-center overflow-hidden px-4 desk:px-6">
                <StepBody text={current.body} />
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="relative mx-2 h-[79px] shrink-0 overflow-hidden rounded-full">
            <div className="absolute inset-0 rounded-[24px] bg-black">
              <NavRow
                tone="light"
                showPrev={showPrev}
                isLast={isLast}
                previousLabel={process.previous}
                nextLabel={process.next}
                restartLabel={process.restart}
              />
            </div>

            <motion.div
              className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 120, damping: 22 }
              }
            >
              <div className="absolute inset-y-0 left-0 w-[min(100vw,574px)] rounded-[24px] bg-lime">
                <NavRow
                  tone="dark"
                  showPrev={showPrev}
                  isLast={isLast}
                  previousLabel={process.previous}
                  nextLabel={process.next}
                  restartLabel={process.restart}
                />
              </div>
            </motion.div>

            <div className="absolute inset-0 flex">
              <button
                type="button"
                className="h-full flex-1"
                disabled={!showPrev}
                aria-label={process.previous}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              />
              <button
                type="button"
                className="h-full flex-1"
                aria-label={isLast ? process.restart : process.next}
                onClick={() =>
                  setStep((s) => (s >= total - 1 ? 0 : s + 1))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
