import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/admin/Button";
import { MemberPage, MemberPanel, MemberShell } from "@/components/ambassador/MemberShell";
import { ProfileForm } from "@/components/ambassador/ProfileForm";
import { getDb } from "@/lib/db";
import { requireMember } from "@/lib/ambassador/gate";
import { memberPath } from "@/lib/ambassador/link";
import { getProfile } from "@/lib/ambassador/profile";
import { parseLocale, routeLocale, type LangParams } from "@/lib/locale";
import { lookupUi } from "@/lib/ui-messages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return { title: lookupUi(locale, "Your profile"), robots: { index: false, follow: false } };
}

export default async function ProfilePage({ params }: LangParams) {
  const locale = await routeLocale(params);
  const member = await requireMember(locale);
  const profile = await getProfile(getDb(), member.id);
  if (!profile) notFound();
  const tr = (text: string) => lookupUi(locale, text);
  return (
    <MemberShell>
      <MemberPage title={tr("Your profile")} actions={<Button href={memberPath(locale)} variant="ghost">{tr("Back to your space")}</Button>}>
        <MemberPanel>
          <ProfileForm
            initial={{
              displayName: profile.displayName,
              bio: profile.bio ?? "",
              home: profile.home ? { id: profile.home.id, name: profile.home.name, country: profile.home.country } : null,
              homeCountry: profile.homeCountry,
              showOnGlobe: profile.showOnGlobe,
              language: parseLocale(profile.language),
            }}
          />
        </MemberPanel>
      </MemberPage>
    </MemberShell>
  );
}
