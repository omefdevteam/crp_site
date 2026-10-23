"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { localePath, persistLocale, type Locale } from "@/lib/locale";
import type { Messages } from "@/lib/messages";
import type { UiOverrides } from "@/lib/ui-messages";
import type { SocialLinks } from "@/lib/copy/social";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  copy: Messages;
  ui: UiOverrides;
  social: SocialLinks;
  path: string;
};

const NO_SOCIAL: SocialLinks = {};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLocale,
  initialPath = "/",
  copy,
  ui = {},
  social = NO_SOCIAL,
  children,
}: {
  initialLocale: Locale;
  initialPath?: string;
  copy: Messages;
  ui?: UiOverrides;
  social?: SocialLinks;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    const destination = localePath(window.location.pathname + window.location.search + window.location.hash, next);
    if (destination !== window.location.pathname + window.location.search + window.location.hash) window.location.assign(destination);
    else setLocaleState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, copy, ui, social, path: initialPath }),
    [locale, setLocale, copy, ui, social, initialPath],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

export function useCopy(): Messages {
  return useLanguage().copy;
}

/** Published footer social links (same for every language). */
export function useSocialLinks(): SocialLinks {
  return useLanguage().social;
}
