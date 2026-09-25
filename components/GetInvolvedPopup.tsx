"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { PartnerCard, YouthAmbassadorCard } from "./GetInvolvedCards";
import { useCopy } from "./LanguageProvider";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[24px]" aria-hidden>
      <path
        d="M5.5 5.5l13 13M18.5 5.5l-13 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type GetInvolvedPopupProps = {
  open: boolean;
  onClose: () => void;
};

export function GetInvolvedPopup({ open, onClose }: GetInvolvedPopupProps) {
  const copy = useCopy();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

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

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label={copy.a11y.closeGetInvolved}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-[80dvh] max-h-[80dvh] w-full flex-col gap-8 overflow-y-auto rounded-tl-[64px] rounded-tr-[64px] bg-black px-5 py-10 text-white desk:gap-[48px] desk:overflow-hidden desk:rounded-tl-[154px] desk:rounded-tr-[154px] desk:px-[64px] desk:py-[96px]"
      >
        <div className="relative flex h-auto w-full shrink-0 items-start justify-end desk:h-[43px] desk:pr-[32px]">
          <h2
            id={titleId}
            className="absolute inset-x-0 top-0 text-center text-[32px] font-normal leading-[0.9] tracking-[-0.04em] desk:text-[48px] desk:tracking-[-1.92px]"
          >
            {copy.involved.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={copy.a11y.closeGetInvolved}
            className="relative z-10 size-[24px] shrink-0 text-white transition-opacity duration-300 hover:opacity-60"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col items-stretch gap-4 desk:flex-row desk:items-center desk:justify-center desk:gap-0">
          <YouthAmbassadorCard surface="popup" onNavigate={onClose} />
          <PartnerCard surface="popup" onNavigate={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
