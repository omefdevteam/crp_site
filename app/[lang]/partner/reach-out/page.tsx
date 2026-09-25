import type { Metadata } from "next";
import { Suspense } from "react";
import { PartnerReachPage } from "@/components/partner/PartnerReachPage";
import { outfit } from "@/lib/fonts";
import { copyFor } from "@/lib/messages";
import { requestLocale } from "@/lib/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const copy = copyFor(await requestLocale());
  return { title: `${copy.partnerPage.reachOutForm.title} — Climate Refugee Pavilion`, robots: { index: false, follow: false } };
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
