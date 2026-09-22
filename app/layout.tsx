import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/LanguageProvider";
import { LOCALE_COOKIE, parseLocale } from "@/lib/locale";
import { copyFor } from "@/lib/messages";
import { outfit } from "@/lib/fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const meta = copyFor(locale).meta.home;
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);

  return (
    <html lang={locale} suppressHydrationWarning className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
