import type { Metadata } from "next";
import { Suspense } from "react";
import { PartnerReachPage } from "@/components/partner/PartnerReachPage";
import { outfit } from "@/lib/fonts";
import { publicSiteCopy } from "@/lib/copy/read";
import { routeLocale, type LangParams } from "@/lib/locale";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { messages } = await publicSiteCopy(await routeLocale(params));
  return { title: `${messages.partnerPage.reachOutForm.title} — Climate Refugee Pavilion`, robots: { index: false, follow: false } };
}

export default function PartnerReachRoute() {
  return (
    <div className={`${outfit.className} flex flex-1 flex-col`}>
      <Suspense>
        <PartnerReachPage />
      </Suspense>
    </div>
  );
}
