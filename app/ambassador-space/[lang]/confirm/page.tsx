import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberCard, MemberShell } from "@/components/ambassador/MemberShell";
import { memberPath } from "@/lib/ambassador/link";
import { routeLocale, type LangParams } from "@/lib/locale";
import { lookupUi } from "@/lib/ui-messages";
import { MemberConfirmForm } from "./form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return { title: lookupUi(locale, "Finish signing in"), referrer: "no-referrer", robots: { index: false, follow: false } };
}

// The code rides after "#". A "?token=" link is refused so the code is never
// echoed back into a page or a server log.
export default async function MemberConfirmPage({ params, searchParams }: LangParams & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await routeLocale(params);
  if ((await searchParams).token !== undefined) redirect(memberPath(locale, "/sign-in?error=link"));
  return (
    <MemberShell>
      <MemberCard title={lookupUi(locale, "Finish signing in")}>
        <MemberConfirmForm />
      </MemberCard>
    </MemberShell>
  );
}
