import type { Metadata } from "next";
import { Button } from "@/components/admin/Button";
import { MemberPage, MemberPanel, MemberShell } from "@/components/ambassador/MemberShell";
import { StoryForm } from "@/components/ambassador/StoryForm";
import { requireMember } from "@/lib/ambassador/gate";
import { memberPath } from "@/lib/ambassador/link";
import { routeLocale, type LangParams } from "@/lib/locale";
import { lookupUi } from "@/lib/ui-messages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return { title: lookupUi(locale, "New story"), robots: { index: false, follow: false } };
}

// Nothing is stored until the first save, so an abandoned page leaves no row.
export default async function NewStoryPage({ params, searchParams }: LangParams & { searchParams: Promise<{ kind?: string }> }) {
  const locale = await routeLocale(params);
  await requireMember(locale);
  const { kind } = await searchParams;
  const tr = (text: string) => lookupUi(locale, text);
  return (
    <MemberShell>
      <MemberPage title={tr("New story")} actions={<Button href={memberPath(locale)} variant="ghost">{tr("Back to your space")}</Button>}>
        <MemberPanel>
          <StoryForm
            initial={{
              id: null,
              version: 0,
              kind: kind === "mission" ? "mission" : "beacon",
              title: "",
              body: "",
              // Most people write in the language they're reading the site in.
              language: locale,
              place: null,
            }}
          />
        </MemberPanel>
        <p className="text-sm text-black/60">{tr("You can add a photo after you save the draft.")}</p>
      </MemberPage>
    </MemberShell>
  );
}
