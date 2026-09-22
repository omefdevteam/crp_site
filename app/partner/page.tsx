import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Footer } from "@/components/Footer";
import { GetInvolvedPill } from "@/components/GetInvolvedPill";
import { Header } from "@/components/Header";
import { PartnerPage } from "@/components/partner/PartnerPage";
import { outfit } from "@/lib/fonts";
import { LOCALE_COOKIE, parseLocale } from "@/lib/locale";
import { copyFor } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const meta = copyFor(locale).meta.partner;
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default function PartnerRoute() {
  return (
    <div className={`${outfit.className} relative flex flex-1 flex-col`}>
      <Header />
      <main className="flex-1">
        <PartnerPage />
      </main>
      <Footer />
      <GetInvolvedPill />
    </div>
  );
}
