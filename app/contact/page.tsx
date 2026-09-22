import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ContactPage } from "@/components/contact/ContactPage";
import { Footer } from "@/components/Footer";
import { GetInvolved } from "@/components/GetInvolved";
import { GetInvolvedPill } from "@/components/GetInvolvedPill";
import { Header } from "@/components/Header";
import { Sponsors } from "@/components/Sponsors";
import { outfit } from "@/lib/fonts";
import { LOCALE_COOKIE, parseLocale } from "@/lib/locale";
import { copyFor } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const meta = copyFor(locale).meta.contact;
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default function ContactRoute() {
  return (
    <div className={`${outfit.className} relative flex flex-1 flex-col`}>
      <Header />
      <main className="flex-1">
        <ContactPage />
        <GetInvolved embedded />
        <Sponsors />
      </main>
      <Footer />
      <GetInvolvedPill />
    </div>
  );
}
