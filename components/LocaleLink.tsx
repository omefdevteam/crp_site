"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/locale";
import { useLanguage } from "@/components/LanguageProvider";
export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { locale } = useLanguage();
  return <Link {...props} href={typeof href === "string" ? localePath(href, locale) : href} />;
}
