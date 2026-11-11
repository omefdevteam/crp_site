"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/admin/Button";
import { area, field } from "@/components/admin/marks";
import { useLanguage } from "@/components/LanguageProvider";
import { PlacePicker, type PickedPlace } from "@/components/ambassador/PlacePicker";
import { saveStoryAction } from "@/app/ambassador-space/[lang]/stories/actions";
import { locales, nativeLanguageNames, type Locale } from "@/lib/locale";
import { BODY_MAX, TITLE_MAX } from "@/lib/ambassador/story-model";
import { useText } from "@/lib/ui-text";

export type StoryFormValues = {
  readonly id: string | null;
  readonly version: number;
  readonly kind: "beacon" | "mission";
  readonly title: string;
  readonly body: string;
  readonly language: Locale;
  readonly place: PickedPlace | null;
};

const length = (value: string) => [...value].length;

export function StoryForm({ initial }: { initial: StoryFormValues }) {
  const tr = useText();
  const { locale } = useLanguage();
  const [state, action, pending] = useActionState(saveStoryAction, null);
  // Controlled, so a refused save keeps what was typed.
  const [kind, setKind] = useState(initial.kind);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [language, setLanguage] = useState<Locale>(initial.language);

  const problems: Record<string, string> = {
    kind: tr("Choose Beacon or Mission."),
    title_long: tr("The title is too long."),
    body_long: tr("The story is too long."),
    language: tr("Choose the language you wrote in."),
    place: tr("Choose the city or town from the list."),
    not_found: tr("This story could not be found."),
    locked: tr("This story is with our team. Withdraw it first to make changes."),
    stale: tr("This story changed in another window. Reload the page and try again."),
    limit: tr("You've reached the limit of 50 stories. Delete an old draft to add a new one."),
    signed_out: tr("You've been signed out. Sign in again; your text is still here to copy."),
  };

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="storyId" value={initial.id ?? ""} />
      <input type="hidden" name="version" value={initial.version} />

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-semibold">{tr("What are you sharing?")}</legend>
        <div className="grid gap-3 desk:grid-cols-2">
          {(["beacon", "mission"] as const).map((option) => (
            <label key={option} className={`flex cursor-pointer gap-3 rounded-3xl border p-4 ${kind === option ? "border-black bg-cream" : "border-black/12"}`}>
              <input type="radio" name="kind" value={option} checked={kind === option} onChange={() => setKind(option)} className="mt-1 accent-black" />
              <span>
                <span className="block font-semibold">{option === "beacon" ? tr("Beacon story") : tr("Mission report")}</span>
                <span className="block text-sm text-black/60">
                  {option === "beacon"
                    ? tr("A story from your community: people, places and the change you see.")
                    : tr("Something that needs action, for the team and partners to follow up.")}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-2 text-sm font-semibold">
        {tr("Title")}
        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX + 20} className={field} />
        <span className={`text-xs font-normal ${length(title) > TITLE_MAX ? "text-magenta" : "text-black/50"}`}>{length(title)} / {TITLE_MAX}</span>
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        {tr("Your story")}
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={9} className={area} />
        <span className={`text-xs font-normal ${length(body) > BODY_MAX ? "text-magenta" : "text-black/50"}`}>{length(body)} / {BODY_MAX}</span>
      </label>

      <PlacePicker name="placeId" label={tr("Where is this story from?")} initial={initial.place} />

      <label className="grid gap-2 text-sm font-semibold">
        {tr("Language you wrote in")}
        <select name="language" value={language} onChange={(e) => setLanguage(e.target.value as Locale)} className={field}>
          {locales.map((code) => <option key={code} value={code}>{nativeLanguageNames[code]}</option>)}
        </select>
      </label>

      <p role="status" aria-live="polite" className="min-h-6 text-sm text-magenta">{state ? problems[state.problem] ?? tr("Not saved. Try again.") : null}</p>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="submit" variant="primary" disabled={pending}>{tr("Send for review")}</Button>
        <Button type="submit" name="intent" value="save" variant="outline" disabled={pending}>{pending ? tr("Saving") : tr("Save draft")}</Button>
      </div>
      <p className="text-xs text-black/50">{tr("Our team reads every story before it appears on the globe. We'll email you when it's live, or if something needs changing.")}</p>
    </form>
  );
}
