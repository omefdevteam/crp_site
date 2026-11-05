import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { requestLocale } from "@/lib/request-locale";
import { siteCopy } from "@/lib/copy/read";
import { lookupUi } from "@/lib/ui-messages";
import { outfit, trail } from "@/lib/fonts";
import { fitVars } from "@/lib/fitSize";
import { TrailPreload } from "@/components/TrailPreload";

// The 404 page for every unknown URL (/xyz, /en/xyz, /de, ...). There is no
// single root layout any more, so Next renders this page on its own.
// It's rendered per request (a 404 response is never the cached page HTML):
// the proxy's x-site-locale header gives the URL's language, or the visitor's
// saved language for URLs without one.
async function translator() {
  const locale = await requestLocale();
  const { ui } = await siteCopy(locale);
  return { locale, t: (text: string) => lookupUi(locale, text, ui) };
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await translator();
  return { title: `${t("Page not found")} — Climate Refugee Pavilion`, robots: { index: false, follow: false } };
}

export default async function GlobalNotFound() {
  const { locale, t } = await translator();

  return (
    <html lang={locale} className={`${outfit.variable} h-full antialiased`}>
      <body className={`${outfit.className} grid min-h-dvh place-items-center bg-cream p-8 text-black`}>
        <main className="max-w-[560px] text-center">
          {/* Page title in Trail, like the other page titles. This page renders outside
              app/[lang]/layout.tsx, but it imports globals.css itself, so the
              Trail @font-face, its size-adjusted fallbacks and .font-trail apply here
              too. <TrailPreload /> adds the same preload hint the about, partner and
              contact pages use, because the heading is the first thing on screen.
              fit-text shrinks the longest word to the room, so long titles such as
              PT/ES "ENCONTRADA" never overflow at 390px. */}
          <TrailPreload />
          <h1
            className={`${trail.className} fit-text uppercase leading-[0.9] tracking-[2.56px] [--fit-max:64px] [--fit-room:calc(100vw_-_72px)] [--fit-track-px:2.56px] desk:tracking-[5.2px] desk:[--fit-max:96px] desk:[--fit-room:552px] desk:[--fit-track-px:5.2px]`}
            style={fitVars(t("Page not found"), "trail", { upper: true })}
          >
            {t("Page not found")}
          </h1>
          <p className="mt-6 text-[18px] leading-snug">
            {t("We couldn't find this page. The link may be wrong, or the page may have moved.")}
          </p>
          {/* Same pill as the site's main buttons (e.g. nominate ThanksStep "Exit"):
              64px on mobile, 80px on desktop, uppercase label. */}
          <Link
            href={`/${locale}`}
            className="gradient-brand mt-8 flex h-16 w-full items-center justify-center rounded-full px-8 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.98] desk:mt-10 desk:h-20"
          >
            <span className="text-[16px] font-semibold uppercase leading-[0.9] tracking-[0.8px] text-white mix-blend-hard-light desk:text-[20px]">
              {t("Go to the homepage")}
            </span>
          </Link>
        </main>
      </body>
    </html>
  );
}
