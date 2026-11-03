import { metadataFor } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { TrailPreload } from "@/components/TrailPreload";
import type { Metadata } from "next";
import { routeLocale, type LangParams } from "@/lib/locale";
import { Footer } from "@/components/Footer";
import { GetInvolvedPill } from "@/components/GetInvolvedPill";
import { Header } from "@/components/Header";
import { PartnerPage } from "@/components/partner/PartnerPage";
import { outfit } from "@/lib/fonts";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return metadataFor("partner", await routeLocale(params));
}

export default async function PartnerRoute({ params }: LangParams) {
  const locale = await routeLocale(params);
  return (<>
      <TrailPreload />
      <StructuredData page="partner" locale={locale} />
    <div className={`${outfit.className} relative flex flex-1 flex-col`}>
      <Header overMedia lightNav />
      <main className="flex-1">
        <PartnerPage />
      </main>
      <Footer />
      <GetInvolvedPill />
    </div>
  </>);
}
