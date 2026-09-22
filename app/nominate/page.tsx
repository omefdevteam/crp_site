import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NominatePage } from "@/components/NominatePage";
import { LOCALE_COOKIE, parseLocale } from "@/lib/locale";
import { copyFor } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const meta = copyFor(locale).meta.nominate;
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default function Page() {
  return <NominatePage />;
}
