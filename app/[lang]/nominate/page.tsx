import { pageMetadata } from "@/lib/seo";
import { requestLocale } from "@/lib/request-locale";
import { StructuredData } from "@/components/StructuredData";
import type { Metadata } from "next";
import { NominatePage } from "@/components/NominatePage";

export async function generateMetadata(): Promise<Metadata> { return pageMetadata(await requestLocale(), "nominate"); }

export default function Page() {
  return <><StructuredData page="nominate" /><NominatePage /></>;
}
