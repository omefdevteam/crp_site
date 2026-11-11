import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/admin/Button";
import { MemberPage, MemberPanel, MemberShell } from "@/components/ambassador/MemberShell";
import { MemberNotice, StoryStatusBadge } from "@/components/ambassador/StoryStatus";
import { getDb } from "@/lib/db";
import { findCountry, countryLabel } from "@/lib/countries";
import { requireMember } from "@/lib/ambassador/gate";
import { memberPath } from "@/lib/ambassador/link";
import { getProfile } from "@/lib/ambassador/profile";
import { listMyStories } from "@/lib/ambassador/stories";
import { routeLocale, type LangParams } from "@/lib/locale";
import { lookupUi } from "@/lib/ui-messages";
import { signOutMember } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return { title: lookupUi(locale, "Your Ambassador space"), robots: { index: false, follow: false } };
}

export default async function MemberHomePage({ params, searchParams }: LangParams & { searchParams: Promise<{ notice?: string }> }) {
  const locale = await routeLocale(params);
  const member = await requireMember(locale);
  const { notice } = await searchParams;
  const tr = (text: string) => lookupUi(locale, text);
  const db = getDb();
  const [profile, mine] = await Promise.all([getProfile(db, member.id), listMyStories(db, member.id)]);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  const country = (code: string | null) => {
    const found = code ? findCountry(code) : undefined;
    return found ? countryLabel(found, locale) : "";
  };

  return (
    <MemberShell>
      <MemberPage
        title={tr("Welcome, {name}.").replace("{name}", member.displayName)}
        actions={
          <form action={signOutMember}>
            <input type="hidden" name="locale" value={locale} />
            <Button variant="ghost" type="submit">{tr("Sign out")}</Button>
          </form>
        }
      >
        <MemberNotice notice={notice} />

        <MemberPanel className="grid gap-4">
          <h2 className="text-xl font-semibold">{tr("Share a story")}</h2>
          <p className="text-base leading-6 text-black/70">
            {tr("Post a story from where you are. Once our team approves it, it appears on the globe on our home page, at the place you choose.")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href={memberPath(locale, "/stories/new?kind=beacon")} variant="primary">{tr("New Beacon story")}</Button>
            <Button href={memberPath(locale, "/stories/new?kind=mission")} variant="outline">{tr("New Mission report")}</Button>
          </div>
        </MemberPanel>

        <MemberPanel className="grid gap-4">
          <h2 className="text-xl font-semibold">{tr("Your stories")}</h2>
          {mine.length === 0 ? (
            <p className="text-base text-black/60">{tr("No stories yet. Your drafts and sent stories will show here.")}</p>
          ) : (
            <ul className="grid gap-3">
              {mine.map((story) => (
                <li key={story.id}>
                  <Link
                    href={memberPath(locale, `/stories/${story.id}`)}
                    className="grid gap-2 rounded-3xl border border-black/10 p-4 transition hover:border-black/30 hover:bg-cream desk:grid-cols-[1fr_auto] desk:items-center"
                  >
                    <span className="grid gap-1">
                      <span className="text-base font-semibold">{story.title ?? tr("Untitled draft")}</span>
                      <span className="text-sm text-black/60">
                        {[story.kind === "beacon" ? tr("Beacon story") : tr("Mission report"), story.city ? `${story.city}, ${country(story.country)}` : null, date.format(story.updatedAt)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {story.status === "rejected" && story.reviewReason ? (
                        <span className="text-sm text-[#a3115f]">{tr("Our team's note:")} {story.reviewReason}</span>
                      ) : null}
                    </span>
                    <StoryStatusBadge status={story.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </MemberPanel>

        <MemberPanel className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{tr("Your profile")}</h2>
            <Button href={memberPath(locale, "/profile")} variant="outline" size="sm">{tr("Edit profile")}</Button>
          </div>
          <dl className="grid gap-2 text-sm desk:grid-cols-[10rem_1fr]">
            <dt className="text-black/60">{tr("Name on the globe")}</dt>
            <dd>{profile?.displayName}</dd>
            <dt className="text-black/60">{tr("Home city")}</dt>
            <dd>{profile?.homeCity ? `${profile.homeCity}, ${country(profile.homeCountry)}` : profile?.homeCountry ? country(profile.homeCountry) : tr("Not set")}</dd>
            <dt className="text-black/60">{tr("On the Ambassadors map")}</dt>
            <dd>{profile?.showOnGlobe ? tr("Yes, at your home city") : tr("No")}</dd>
          </dl>
        </MemberPanel>
      </MemberPage>
    </MemberShell>
  );
}
