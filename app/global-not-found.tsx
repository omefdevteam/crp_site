import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { requestLocale } from "@/lib/request-locale";
import { siteCopy } from "@/lib/copy/read";
import { lookupUi } from "@/lib/ui-messages";
import { outfit } from "@/lib/fonts";

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
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.8px] desk:text-[44px]">{t("Page not found")}</h1>
          <p className="mt-4 text-[18px] leading-snug">
            {t("We couldn't find this page. The link may be wrong, or the page may have moved.")}
          </p>
          <Link
            href={`/${locale}`}
            className="gradient-brand mt-8 inline-flex items-center justify-center rounded-full px-8 py-4 text-[18px] font-medium text-white"
          >
            {t("Go to the homepage")}
          </Link>
        </main>
      </body>
    </html>
  );
}
