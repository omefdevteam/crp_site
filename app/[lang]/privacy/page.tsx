import { metadataFor } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import type { Metadata } from "next";
import { routeLocale, type LangParams } from "@/lib/locale";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PrivacyPage } from "@/components/privacy/PrivacyPage";
import { outfit } from "@/lib/fonts";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return metadataFor("privacy", await routeLocale(params));
}

export default async function PrivacyRoute({ params }: LangParams) {
  const locale = await routeLocale(params);
  return (
    <>
      <StructuredData page="privacy" locale={locale} />
      <div className={`${outfit.className} relative flex flex-1 flex-col`}>
        <Header />
        <main className="flex-1">
          <PrivacyPage />
        </main>
        <Footer pillSpace={false} />
      </div>
    </>
  );
}
