"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClass } from "@/components/admin/Button";
import { ResultLine } from "@/components/admin/ResultLine";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { card } from "@/components/admin/marks";
import type { RepeatFormState } from "@/app/admin/(console)/records/repeats/actions";
import type { MatchView } from "@/lib/duplicates/review";

type Action = (previous: RepeatFormState, formData: FormData) => Promise<RepeatFormState>;

const RESULT: Record<string, string> = {
  saved: "Saved.",
  forbidden: "You can't decide about repeats on this list.",
  invalid: "Not saved. Reload the page and try again.",
  not_found: "That match could not be found.",
  stale: "Someone else decided this a moment ago. Reload the page to see it.",
  not_installed: "Repeat checks aren't switched on yet.",
};

function day(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function Decide({ match, path, action, verb, label, variant }: { match: MatchView; path: string; action: (formData: FormData) => void; verb: string; label: string; variant: "solid" | "outline" | "ghost" }) {
  return (
    <form action={action}>
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="expected" value={match.status} />
      <input type="hidden" name="verb" value={verb} />
      <input type="hidden" name="path" value={path} />
      <SubmitButton className={buttonClass(variant, "sm")} pendingLabel="Saving">{label}</SubmitButton>
    </form>
  );
}

// "Possible repeat" notes on a record's page. Nothing here merges or deletes:
// confirming only labels this entry and takes it out of the people counts.
export function RepeatsPanel({ matches, path, canDecide, action }: { matches: readonly MatchView[]; path: string; canDecide: boolean; action: Action }) {
  const [state, run] = useActionState(action, null);
  const shown = matches.filter((match) => match.other);
  if (shown.length === 0) return null;
  const open = shown.filter((match) => match.status === "suggested").length;

  return (
    <section className={`${card} border-2 ${open > 0 ? "border-[#fa8d2e]/50" : "border-transparent"}`} aria-labelledby="repeats-title">
      <ResultLine message={state ? RESULT[state.result] ?? "Not saved." : null} tone={state?.result === "saved" ? "ok" : "warn"} />
      <h2 id="repeats-title" className="text-lg font-semibold">
        {open > 0 ? (open === 1 ? "Possible repeat entry" : `${open} possible repeat entries`) : "Repeat entries"}
      </h2>
      <p className="mt-1 text-sm text-black/60">
        The same person sending this form again for the same purpose. Confirming keeps both entries and labels the later one as a repeat. Nothing is deleted.
      </p>
      <ul className="mt-4 grid gap-3">
        {shown.map((match) => {
          const other = match.other!;
          const relation = match.side === "earlier" ? "This entry repeats" : "Repeated later by";
          return (
            <li key={match.id} className="grid gap-3 rounded-3xl border border-black/10 p-4 desk:grid-cols-[1fr_auto] desk:items-center">
              <div className="min-w-0">
                <p className="text-sm">
                  {relation}{" "}
                  <Link href={other.href} className="font-semibold underline underline-offset-4">{other.name}</Link>{" "}
                  <span className="text-black/60">({other.email}, {day(other.createdAt)})</span>
                </p>
                <p className="mt-1 text-xs text-black/60">Why: {match.reasons.join(", ")}.</p>
                <p className="mt-1 text-xs font-semibold">
                  {match.status === "suggested"
                    ? "Waiting for a decision"
                    : match.status === "confirmed"
                      ? match.automatic ? "Confirmed automatically: sent twice within minutes" : "Confirmed as a repeat"
                      : "Marked as not a repeat"}
                </p>
              </div>
              {canDecide ? (
                <div className="flex flex-wrap gap-2">
                  {match.status === "suggested" ? (
                    <>
                      <Decide match={match} path={path} action={run} verb="confirm" label="Same person, repeat" variant="solid" />
                      <Decide match={match} path={path} action={run} verb="dismiss" label="Not a repeat" variant="outline" />
                    </>
                  ) : (
                    <Decide match={match} path={path} action={run} verb="reopen" label="Undo" variant="ghost" />
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
