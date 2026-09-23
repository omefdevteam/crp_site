import { structuredData, type PageKey } from "@/lib/seo";
import { requestLocale } from "@/lib/request-locale";
export async function StructuredData({ page }: { page: PageKey }) {
  const data = structuredData(await requestLocale(), page);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
