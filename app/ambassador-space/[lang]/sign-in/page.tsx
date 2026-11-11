import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberCard, MemberShell } from "@/components/ambassador/MemberShell";
import { currentMember } from "@/lib/ambassador/gate";
import { memberPath } from "@/lib/ambassador/link";
import { routeLocale, type LangParams } from "@/lib/locale";
import { lookupUi } from "@/lib/ui-messages";
import { MemberSignInForm } from "./form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return { title: lookupUi(locale, "Ambassador sign in"), robots: { index: false, follow: false } };
}

export default async function MemberSignInPage({ params, searchParams }: LangParams & { searchParams: Promise<{ error?: string }> }) {
  const locale = await routeLocale(params);
  if (await currentMember()) redirect(memberPath(locale));
  const { error } = await searchParams;
  return (
    <MemberShell>
      <MemberCard title={lookupUi(locale, "Ambassador sign in")}>
        <MemberSignInForm expired={error === "link"} />
      </MemberCard>
    </MemberShell>
  );
}
