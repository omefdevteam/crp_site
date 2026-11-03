import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/locale";
import { NavProgress } from "@/components/NavProgress";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ConsentProvider } from "@/components/cookies/ConsentProvider";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { publicSiteCopy } from "@/lib/copy/read";
import { outfit } from "@/lib/fonts";
import "../globals.css";

// Root layout for the public pages. Everything here is the same for every
// visitor: the locale comes from the URL (params), never from headers, cookies
// or the session, so each /{lang}/... page is prerendered once and its HTML is
// cached (ISR). Consent, PostHog, the language cookie and form drafts all live
// in the browser. Publishing copy in /admin clears these pages straight away
// (lib/copy/read.ts expireCopy); otherwise they refresh every 10 minutes.
export const revalidate = 600;
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const metadata: Metadata = { title: "Climate Refugee Pavilion", robots: { index: false, follow: false } };

export default async function LanguageRootLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const site = await publicSiteCopy(lang);

  return (
    <html lang={lang} className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <LanguageProvider initialLocale={lang} copy={site.messages} ui={site.ui} social={site.social}>
          <ConsentProvider>
            <PostHogProvider>
              {children}
              <NavProgress />
            </PostHogProvider>
          </ConsentProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
