"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import type { GlobeCard } from "@/lib/ambassador/globe-model";
import { countryLabel, findCountry } from "@/lib/countries";
import { pinGroups } from "@/lib/pins";
import { useLanguage } from "@/components/LanguageProvider";
import { useText } from "@/lib/ui-text";
import { PinIcon } from "./PinIcon";

function place(card: GlobeCard, locale: string): string {
  const country = findCountry(card.country);
  return `${card.city}, ${country ? countryLabel(country, locale) : card.country}`;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const PANEL =
  "fixed inset-x-3 bottom-3 z-[60] max-h-[80vh] overflow-y-auto rounded-[32px] bg-black p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/10 desk:absolute desk:inset-x-auto desk:bottom-auto desk:right-0 desk:top-[18%] desk:w-[360px] desk:max-h-[min(70vh,560px)]";

function usePanel(open: boolean, onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      returnTo?.focus?.();
    };
  }, [open]);
  return closeRef;
}

// What opens when someone picks an Ambassador pin: the story, or the
// Ambassador. Text is shown as the Ambassador wrote it, in their language.
export function StoryCard({ card, onClose }: { card: GlobeCard | null; onClose: () => void }) {
  const tr = useText();
  const { locale } = useLanguage();
  const reduce = useReducedMotion();
  const titleId = useId();
  const closeRef = usePanel(card !== null, onClose);

  return (
    <AnimatePresence>
      {card ? (
        <motion.div
          key={card.pinId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={PANEL}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: pinGroups[card.group].accent }}>
              <PinIcon group={card.group} className="h-3.5 w-3.5" />
              {card.group === "beacons" ? tr("Beacon story") : card.group === "missions" ? tr("Mission report") : tr("Ambassador")}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={tr("Close")}
              className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
            >
              <CloseIcon />
            </button>
          </div>
          {card.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- served by our own route, already sized
            <img src={card.photo} alt="" loading="lazy" className="mt-4 aspect-[4/3] w-full rounded-[24px] bg-white/5 object-cover" />
          ) : null}
          <h3 id={titleId} lang={card.language ?? undefined} className="mt-4 text-[24px] font-semibold leading-[1.05] tracking-[-0.6px]">
            {card.title}
          </h3>
          <p className="mt-2 text-[14px] text-white/60">{place(card, locale)}</p>
          {card.excerpt ? (
            <p lang={card.language ?? undefined} className="mt-4 text-[16px] leading-[1.4] text-white/90">{card.excerpt}</p>
          ) : null}
          {card.author ? (
            <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white/60">
              {tr("By {name}").replace("{name}", card.author)}
            </p>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// The same Ambassador content as a list, for phones and reduced motion, where
// the live globe (and so its pins) never loads.
export function StoryList({
  open,
  cards,
  onPick,
  onClose,
}: {
  open: boolean;
  cards: readonly GlobeCard[];
  onPick: (card: GlobeCard) => void;
  onClose: () => void;
}) {
  const tr = useText();
  const { locale } = useLanguage();
  const titleId = useId();
  const closeRef = usePanel(open, onClose);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="false" aria-labelledby={titleId} className={PANEL} onPointerDown={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between gap-3">
        <h3 id={titleId} className="text-[14px] font-semibold uppercase tracking-[0.12em]">{tr("On the globe")}</h3>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={tr("Close")}
          className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          <CloseIcon />
        </button>
      </div>
      <ul className="mt-3 grid gap-2">
        {cards.map((card) => (
          <li key={card.pinId}>
            <button
              type="button"
              onClick={() => onPick(card)}
              className="grid w-full gap-0.5 rounded-[20px] bg-white/5 px-4 py-3 text-left transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
            >
              <span lang={card.language ?? undefined} className="text-[16px] font-semibold leading-tight">{card.title}</span>
              <span className="text-[13px] text-white/60">{place(card, locale)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
