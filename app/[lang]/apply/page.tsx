import { metadataFor } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import type { Metadata } from "next";
import { routeLocale, type LangParams } from "@/lib/locale";
import { ApplyPage } from "@/components/ApplyPage";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return metadataFor("apply", await routeLocale(params));
}

export default async function Page({ params }: LangParams) {
  const locale = await routeLocale(params);
  return <><StructuredData page="apply" locale={locale} /><ApplyPage /></>;
}
