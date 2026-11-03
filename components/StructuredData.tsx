import { publicSiteCopy } from "@/lib/copy/read";
import type { Locale } from "@/lib/locale";
import { structuredData, type PageKey } from "@/lib/seo";

// Rendered on the prerendered public pages: the locale comes from the route params.
export async function StructuredData({ page, locale }: { page: PageKey; locale: Locale }) {
  const { messages } = await publicSiteCopy(locale);
  const data = structuredData({ locale, messages }, page);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
