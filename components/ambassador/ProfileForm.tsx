"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/admin/Button";
import { area, field } from "@/components/admin/marks";
import { useLanguage } from "@/components/LanguageProvider";
import { PlacePicker, type PickedPlace } from "@/components/ambassador/PlacePicker";
import { saveProfileAction } from "@/app/ambassador-space/[lang]/profile/actions";
import { locales, nativeLanguageNames, type Locale } from "@/lib/locale";
import { BIO_MAX, DISPLAY_NAME_MAX } from "@/lib/ambassador/story-model";
import { useText } from "@/lib/ui-text";

export type ProfileValues = {
  readonly displayName: string;
  readonly bio: string;
  readonly home: PickedPlace | null;
  readonly homeCountry: string | null;
  readonly showOnGlobe: boolean;
  readonly language: Locale;
};

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const tr = useText();
  const { locale } = useLanguage();
  const [state, action, pending] = useActionState(saveProfileAction, null);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [showOnGlobe, setShowOnGlobe] = useState(initial.showOnGlobe);
  const [language, setLanguage] = useState<Locale>(initial.language);

  const problems: Record<string, string> = {
    name: tr("Enter the name to show with your stories."),
    name_long: tr("That name is too long."),
    bio_long: tr("The short bio is too long."),
    place: tr("Choose your city or town from the list."),
    language: tr("Choose a language."),
    globe_needs_home: tr("Choose your home city to appear on the Ambassadors map."),
    not_found: tr("Your account could not be found."),
    signed_out: tr("You've been signed out. Sign in again."),
  };

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="locale" value={locale} />
      <label className="grid gap-2 text-sm font-semibold">
        {tr("Name shown with your stories")}
        <input name="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={DISPLAY_NAME_MAX} required className={field} />
        <span className="text-xs font-normal text-black/50">{tr("Your first name is enough. This is public once a story is live.")}</span>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {tr("Short bio (optional)")}
        <textarea name="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={area} />
        <span className={`text-xs font-normal ${[...bio].length > BIO_MAX ? "text-magenta" : "text-black/50"}`}>{[...bio].length} / {BIO_MAX}</span>
      </label>
      <PlacePicker name="homePlaceId" label={tr("Your home city or town")} initial={initial.home} initialCountry={initial.homeCountry} keepValue="keep" />
      <label className="flex cursor-pointer gap-3 rounded-3xl border border-black/12 p-4">
        <input type="checkbox" name="showOnGlobe" checked={showOnGlobe} onChange={(e) => setShowOnGlobe(e.target.checked)} className="mt-1 accent-black" />
        <span>
          <span className="block font-semibold">{tr("Show me on the Ambassadors map")}</span>
          <span className="block text-sm text-black/60">{tr("Your name appears on the home page globe at your home city. Your email is never shown.")}</span>
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {tr("Language for our emails")}
        <select name="language" value={language} onChange={(e) => setLanguage(e.target.value as Locale)} className={field}>
          {locales.map((code) => <option key={code} value={code}>{nativeLanguageNames[code]}</option>)}
        </select>
      </label>
      <p role="status" aria-live="polite" className="min-h-6 text-sm text-magenta">{state ? problems[state.problem] ?? tr("Not saved. Try again.") : null}</p>
      <div>
        <Button type="submit" variant="primary" disabled={pending}>{pending ? tr("Saving") : tr("Save profile")}</Button>
      </div>
    </form>
  );
}
