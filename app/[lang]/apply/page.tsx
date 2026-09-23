import { pageMetadata } from "@/lib/seo";
import { requestLocale } from "@/lib/request-locale";
import { StructuredData } from "@/components/StructuredData";
import type { Metadata } from "next";
import { ApplyPage } from "@/components/ApplyPage";

export async function generateMetadata(): Promise<Metadata> { return pageMetadata(await requestLocale(), "apply"); }

export default function Page() {
  return <><StructuredData page="apply" /><ApplyPage /></>;
}
