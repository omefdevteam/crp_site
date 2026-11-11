import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/admin/Button";
import { ConfirmSubmit } from "@/components/admin/SubmitButton";
import { buttonClass } from "@/components/admin/Button";
import { MemberPage, MemberPanel, MemberShell } from "@/components/ambassador/MemberShell";
import { PhotoField } from "@/components/ambassador/PhotoField";
import { StoryForm } from "@/components/ambassador/StoryForm";
import { MemberNotice, StoryStatusBadge } from "@/components/ambassador/StoryStatus";
import { getDb } from "@/lib/db";
import { countryLabel, findCountry } from "@/lib/countries";
import { requireMember } from "@/lib/ambassador/gate";
import { memberPath } from "@/lib/ambassador/link";
import { DELETABLE, WITHDRAWABLE, canEdit } from "@/lib/ambassador/story-model";
import { getMyStory } from "@/lib/ambassador/stories";
import { placeByName } from "@/lib/places/search";
import { parseLocale, routeLocale, type LangParams } from "@/lib/locale";
import { lookupUi } from "@/lib/ui-messages";
import { deleteStoryAction, withdrawStoryAction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string; id: string }>; searchParams: Promise<{ notice?: string; missing?: string }> };

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return { title: lookupUi(locale, "Your story"), robots: { index: false, follow: false } };
}

export default async function StoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const locale = await routeLocale(params);
  const member = await requireMember(locale);
  const story = await getMyStory(getDb(), member.id, id);
  if (!story) notFound();
  const { notice, missing } = await searchParams;
  const tr = (text: string) => lookupUi(locale, text);
  const editable = canEdit(story.status);
  const place = story.country && story.city ? placeByName(story.country, story.city) : null;
  const countryName = story.country ? (findCountry(story.country) ? countryLabel(findCountry(story.country)!, locale) : story.country) : "";

  return (
    <MemberShell>
      <MemberPage
        title={story.title ?? tr("Untitled draft")}
        actions={<Button href={memberPath(locale)} variant="ghost">{tr("Back to your space")}</Button>}
      >
        <div className="flex flex-wrap items-center gap-3">
          <StoryStatusBadge status={story.status} />
          <span className="text-sm text-black/60">{story.kind === "beacon" ? tr("Beacon story") : tr("Mission report")}</span>
        </div>
        <MemberNotice notice={notice} missing={missing} />
        {story.status === "rejected" && story.reviewReason ? (
          <MemberPanel className="border-2 border-[#fde4f1]">
            <h2 className="text-base font-semibold">{tr("Our team's note")}</h2>
            <p className="mt-2 whitespace-pre-line text-base leading-6">{story.reviewReason}</p>
            <p className="mt-3 text-sm text-black/60">{tr("Make the changes below and send it again.")}</p>
          </MemberPanel>
        ) : null}

        <MemberPanel className="grid gap-6 desk:grid-cols-[1fr_16rem]">
          {editable ? (
            <StoryForm
              initial={{
                id: story.id,
                version: story.version,
                kind: story.kind,
                title: story.title ?? "",
                body: story.body ?? "",
                language: parseLocale(story.language),
                place: place ? { id: place.id, name: place.name, country: place.country } : null,
              }}
            />
          ) : (
            <div className="grid content-start gap-4">
              <p className="text-sm text-black/60">{story.city ? `${story.city}, ${countryName}` : null}</p>
              <p className="whitespace-pre-line text-base leading-7">{story.body}</p>
              <p className="text-sm text-black/60">
                {story.status === "submitted"
                  ? tr("Our team is reading this story. To change it, withdraw it first.")
                  : tr("This story is live on the globe. To change it, withdraw it, edit it and send it again.")}
              </p>
            </div>
          )}
          <PhotoField storyId={story.id} version={story.version} hasPhoto={Boolean(story.photoPathname)} editable={editable} />
        </MemberPanel>

        <div className="flex flex-wrap gap-3">
          {WITHDRAWABLE.includes(story.status) ? (
            <form action={withdrawStoryAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="storyId" value={story.id} />
              <ConfirmSubmit
                className={buttonClass("outline")}
                pendingLabel={tr("Withdrawing")}
                title={story.status === "approved" ? tr("Take this story off the globe?") : tr("Withdraw this story?")}
                message={tr("You can edit it and send it again afterwards.")}
                confirmLabel={tr("Withdraw")}
              >
                {tr("Withdraw")}
              </ConfirmSubmit>
            </form>
          ) : null}
          {DELETABLE.includes(story.status) ? (
            <form action={deleteStoryAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="storyId" value={story.id} />
              <ConfirmSubmit
                className={buttonClass("ghost")}
                confirmVariant="danger"
                pendingLabel={tr("Deleting")}
                title={tr("Delete this story?")}
                message={tr("The story and its photo are deleted for good.")}
                confirmLabel={tr("Delete")}
              >
                {tr("Delete story")}
              </ConfirmSubmit>
            </form>
          ) : null}
        </div>
      </MemberPage>
    </MemberShell>
  );
}
