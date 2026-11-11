import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/admin/Button";
import { EmailLine } from "@/components/admin/EmailLine";
import { StoryReviewPanel } from "@/components/admin/StoryReviewPanel";
import { When } from "@/components/admin/When";
import { card } from "@/components/admin/marks";
import { countryLabel, findCountry } from "@/lib/countries";
import { getDb } from "@/lib/db";
import { languageLabel } from "@/lib/admin/labels";
import { allowedVerbs, loadForReview } from "@/lib/ambassador/review";
import { placeByName } from "@/lib/places/search";
import { requireStaff } from "@/lib/staff/gate";
import { reviewStoryAction } from "./actions";

export const metadata: Metadata = { title: "Story" };

const STATUS = { draft: "Draft", submitted: "Waiting for review", approved: "On the globe", rejected: "Sent back", withdrawn: "Withdrawn" } as const;

function stamp(value: Date | null): string {
  return value ? value.toISOString().slice(0, 16).replace("T", " ") : "";
}

export default async function StoryReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("stories.review");
  const { id } = await params;
  const story = await loadForReview(getDb(), id).catch(() => null);
  if (!story) notFound();
  const country = story.country ? findCountry(story.country) : undefined;
  const listed = story.country && story.city ? placeByName(story.country, story.city) : null;
  const verbs = allowedVerbs(story.status);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-black/60">{story.kind === "beacon" ? "Beacon story" : "Mission report"} · {STATUS[story.status]}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{story.title ?? "Untitled"}</h1>
        </div>
        <Button href="/admin/stories" variant="outline">All stories</Button>
      </div>

      <div className="grid gap-6 desk:grid-cols-[1fr_22rem]">
        <div className="grid content-start gap-6">
          <section className={`${card} grid gap-4`}>
            {story.photoPathname ? (
              // eslint-disable-next-line @next/next/no-img-element -- a private image the optimiser must not cache
              <img src={`/admin/stories/${story.id}/photo?v=${story.version}`} alt="Photo sent with the story" className="max-h-[28rem] w-full rounded-3xl bg-cream object-contain" />
            ) : (
              <p className="text-sm text-black/50">No photo.</p>
            )}
            <p className="whitespace-pre-line text-base leading-7">{story.body}</p>
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold">History</h2>
            <ol className="mt-3 grid gap-3 text-sm">
              {story.history.map((event, index) => (
                <li key={index} className="border-t border-black/10 pt-3 first:border-t-0 first:pt-0">
                  <span className="font-semibold">{event.from ? `${STATUS[event.from]} → ${STATUS[event.to]}` : `Started as ${STATUS[event.to].toLowerCase()}`}</span>
                  <span className="text-black/60"> · {event.actor === "staff" ? event.staff ?? "Staff" : "Ambassador"} · <When stamp={stamp(event.at)} /></span>
                  {event.reason ? <p className="mt-1 whitespace-pre-line text-black/70">{event.reason}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="grid content-start gap-6">
          <section className={card}>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-black/60">Ambassador</dt>
                <dd className="font-semibold">{story.author.name}</dd>
                <dd><EmailLine email={story.author.email} /></dd>
                {!story.author.active ? <dd className="mt-1 text-magenta">No longer an active Ambassador. Their stories stay off the globe.</dd> : null}
              </div>
              <div>
                <dt className="text-black/60">Pin</dt>
                <dd>{story.city ? `${story.city}, ${country ? countryLabel(country, "en") : story.country}` : "No place"}</dd>
                {story.lat != null && story.lng != null ? <dd className="text-black/50">{story.lat.toFixed(3)}, {story.lng.toFixed(3)}</dd> : null}
              </div>
              <div>
                <dt className="text-black/60">Written in</dt>
                <dd>{languageLabel(story.language)}</dd>
              </div>
              <div>
                <dt className="text-black/60">Sent</dt>
                <dd>{story.submittedAt ? <When stamp={stamp(story.submittedAt)} /> : "Not sent"}</dd>
              </div>
              {story.reviewReason ? (
                <div>
                  <dt className="text-black/60">Last note to the Ambassador</dt>
                  <dd className="whitespace-pre-line">{story.reviewReason}</dd>
                </div>
              ) : null}
            </dl>
          </section>
          <StoryReviewPanel
            storyId={story.id}
            version={story.version}
            verbs={verbs}
            place={listed ? { id: listed.id, name: listed.name, country: listed.country } : null}
            action={reviewStoryAction}
          />
        </div>
      </div>
    </div>
  );
}
