"use client";

import { useText } from "@/lib/ui-text";

import { useEffect } from "react";
import { createPortal } from "react-dom";

// Full-screen "Redirecting you to …" screen shown while the application is
// created and the browser hands off (to VideoAsk on success, or the homepage
// when the applicant is not eligible).
export function RedirectingStep({ message, onClose }: { message: string; onClose?: () => void }) {
  const tr = useText();
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-cream p-4">
      <div className="flex w-full max-w-[590px] flex-col items-center gap-4 rounded-[48px] bg-white px-8 py-24 text-center desk:rounded-[88px]">
        <p
          role="status"
          className="max-w-[16ch] text-[28px] leading-[0.95] tracking-[-1.12px] text-black desk:text-[32px]"
        >
          {message}
        </p>
        {onClose ? <button type="button" onClick={onClose} className="mt-4 rounded-full bg-black px-6 py-3 text-white">{tr("Close / Fermer")}</button> : <span className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-2 animate-pulse rounded-full bg-black/40"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>}
      </div>
    </div>,
    document.body,
  );
}
