"use client";

import { useEffect, useRef } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { createPortal } from "react-dom";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SITE_KEY = TURNSTILE_SITE_KEY;

export type TurnstileStatus = "loading" | "ready" | "error";

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile script failed to load"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Renders the managed Turnstile widget and hands its token up. Renders nothing
// when no site key is configured, so the forms still work in dev.
// In-flow by default so it never covers cookie or form buttons. Pass `float`
// to keep the old fixed corner badge on tight cards (waitlist / get involved).
export function Turnstile({
  onToken,
  onStatus,
  size = "flexible",
  appearance = "always",
  theme = "auto",
  float = false,
  className,
}: {
  onToken: (token: string | null) => void;
  onStatus?: (status: TurnstileStatus) => void;
  size?: "normal" | "compact" | "flexible";
  appearance?: "always" | "interaction-only" | "execute";
  theme?: "light" | "dark" | "auto";
  float?: boolean;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const cbRef = useRef(onToken);
  const statusRef = useRef(onStatus);
  const mounted = useHydrated();
  useEffect(() => {
    cbRef.current = onToken;
    statusRef.current = onStatus;
  }, [onToken, onStatus]);
  useEffect(() => {
    if (!SITE_KEY || !mounted || !boxRef.current) return;
    let cancelled = false;
    const box = boxRef.current;
    statusRef.current?.("loading");

    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetId.current = window.turnstile.render(box, {
          sitekey: SITE_KEY,
          appearance,
          size,
          theme,
          callback: (token: string) => {
            statusRef.current?.("ready");
            cbRef.current(token);
          },
          "error-callback": () => {
            statusRef.current?.("error");
            cbRef.current(null);
          },
          "expired-callback": () => {
            statusRef.current?.("error");
            cbRef.current(null);
          },
        });
      })
      .catch(() => {
        statusRef.current?.("error");
        cbRef.current(null);
      });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // Widget already gone; nothing to clean up.
        }
        widgetId.current = null;
      }
    };
  }, [mounted, size, appearance, theme]);

  if (!SITE_KEY || !mounted) return null;
  const box = (
    <div
      ref={boxRef}
      className={float ? "fixed bottom-4 left-4 z-[100]" : className}
    />
  );
  return float ? createPortal(box, document.body) : box;
}
