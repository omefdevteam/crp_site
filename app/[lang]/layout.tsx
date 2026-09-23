import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
export default async function LanguageLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return children;
}
