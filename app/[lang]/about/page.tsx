import { pageMetadata } from "@/lib/seo";
import { requestLocale } from "@/lib/request-locale";
import { StructuredData } from "@/components/StructuredData";
import type { Metadata } from "next";
import { AboutPage } from "@/components/about/AboutPage";
import { Footer } from "@/components/Footer";
import { GetInvolved } from "@/components/GetInvolved";
import { GetInvolvedPill } from "@/components/GetInvolvedPill";
import { Header } from "@/components/Header";
import { outfit } from "@/lib/fonts";

export async function generateMetadata(): Promise<Metadata> { return pageMetadata(await requestLocale(), "about"); }

export default function AboutRoute() {
  return (<>
      <StructuredData page="about" />
    <div className={`${outfit.className} relative flex flex-1 flex-col`}>
      <Header overMedia />
      <main className="flex-1">
        <AboutPage />
        <GetInvolved embedded />
      </main>
      <Footer />
      <GetInvolvedPill />
    </div>
  </>);
}
