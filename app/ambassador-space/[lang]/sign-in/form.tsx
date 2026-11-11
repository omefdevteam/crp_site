"use client";

import { useActionState } from "react";
import { Button } from "@/components/admin/Button";
import { field } from "@/components/admin/marks";
import { useLanguage } from "@/components/LanguageProvider";
import { useText } from "@/lib/ui-text";
import { requestMemberLink } from "./actions";

export function MemberSignInForm({ expired }: { expired: boolean }) {
  const tr = useText();
  const { locale } = useLanguage();
  const [state, action, pending] = useActionState(requestMemberLink, null);
  const message = state?.status === "sent"
    ? tr("If this address belongs to an Ambassador, a sign-in link is on its way. Check your inbox.")
    : state?.status === "invalid"
      ? tr("Enter your email address.")
      : expired
        ? tr("That link has expired or was already used. Ask for a new one below.")
        : null;
  return (
    <form action={action} className="mt-6 grid gap-4">
      <p className="text-base leading-6 text-black/70">
        {tr("Enter the email address you applied with. We'll email you a link to sign in.")}
      </p>
      <input type="hidden" name="locale" value={locale} />
      <label className="grid gap-2 text-sm font-semibold" htmlFor="email">
        {tr("Your email")}
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required autoFocus className={field} />
      </label>
      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? tr("Sending") : tr("Email me a sign-in link")}
      </Button>
      <p role="status" aria-live="polite" className={`min-h-6 text-sm ${state ? "text-black" : "text-magenta"}`}>{message}</p>
      {state?.devLink ? <Button href={state.devLink} variant="outline">{tr("Open the sign-in link")}</Button> : null}
    </form>
  );
}
