import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
import { NavProgress } from "@/components/NavProgress";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ConsentProvider } from "@/components/cookies/ConsentProvider";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { publicSiteCopy } from "@/lib/copy/read";
import { outfit } from "@/lib/fonts";
import "../../globals.css";

// Root layout for the Ambassador space. Visitors reach it at /{lang}/ambassador:
// proxy.ts rewrites that address to this folder, and refuses /ambassador-space
// itself. It lives outside app/[lang] because those pages are prerendered once
// and cached for everyone, while every page here belongs to one signed-in
// person and reads their session cookie. Same header, footer, copy and
// consent as the public site.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Climate Refugee Pavilion", robots: { index: false, follow: false } };

export default async function AmbassadorRootLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const site = await publicSiteCopy(lang);

  return (
    <html lang={lang} className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <LanguageProvider initialLocale={lang} initialPath="/ambassador" copy={site.messages} ui={site.ui} social={site.social}>
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
