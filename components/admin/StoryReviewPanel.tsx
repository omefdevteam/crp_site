"use client";

import { useActionState, useState } from "react";
import { buttonClass } from "@/components/admin/Button";
import { ResultLine } from "@/components/admin/ResultLine";
import { area, card } from "@/components/admin/marks";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/SubmitButton";
import { PlacePicker, type PickedPlace } from "@/components/ambassador/PlacePicker";
import type { ReviewFormState } from "@/app/admin/(console)/stories/[id]/actions";
import type { ReviewVerb } from "@/lib/ambassador/review";

type Action = (previous: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;

const RESULT: Record<string, string> = {
  forbidden: "You don't have permission to review stories.",
  invalid: "Not saved. Reload the page and try again.",
  not_found: "This story could not be found. The Ambassador may have withdrawn it.",
  stale: "This story changed since you opened it. Reload the page to see the latest.",
  not_allowed: "That decision isn't available for this story any more. Reload the page.",
  reason: "Write a note for the Ambassador (up to 500 characters).",
  place: "Choose the new city or town from the list.",
};

const SAVED: Record<string, string> = {
  approve: "Approved. It's on the globe and the Ambassador has been emailed.",
  reject: "Sent back. The Ambassador has been emailed your note.",
  takedown: "Taken off the globe. The Ambassador has been emailed your note.",
  move: "Pin moved.",
};

function Hidden({ storyId, version, verb }: { storyId: string; version: number; verb: ReviewVerb }) {
  return (
    <>
      <input type="hidden" name="storyId" value={storyId} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="verb" value={verb} />
    </>
  );
}

export function StoryReviewPanel({
  storyId,
  version,
  verbs,
  place,
  action,
}: {
  storyId: string;
  version: number;
  verbs: readonly ReviewVerb[];
  place: PickedPlace | null;
  action: Action;
}) {
  const [state, run] = useActionState(action, null);
  const [reason, setReason] = useState("");
  const message = state ? (state.result === "saved" ? SAVED[state.verb ?? ""] ?? "Saved." : RESULT[state.result] ?? "Not saved.") : null;
  const sendBack = verbs.includes("reject") ? "reject" : verbs.includes("takedown") ? "takedown" : null;

  if (verbs.length === 0) {
    // A decision that just closed the story still shows its confirmation.
    return (
      <section className={card}>
        <ResultLine message={message} tone={state?.result === "saved" ? "ok" : "warn"} />
        <p className="text-sm text-black/60">No decision is open for this story. It is with its Ambassador.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <ResultLine message={message} tone={state?.result === "saved" ? "ok" : "warn"} />
      {verbs.includes("approve") ? (
        <section className={card}>
          <h2 className="text-lg font-semibold">Approve</h2>
          <p className="mt-1 text-sm text-black/60">The story goes on the home page globe at its pin, and the Ambassador gets an email.</p>
          <form action={run} className="mt-4">
            <Hidden storyId={storyId} version={version} verb="approve" />
            <ConfirmSubmit
              className={buttonClass("primary")}
              pendingLabel="Approving"
              title="Put this story on the globe?"
              message="It becomes public straight away, with its photo and the Ambassador's display name."
              confirmLabel="Approve"
            >
              Approve for the globe
            </ConfirmSubmit>
          </form>
        </section>
      ) : null}

      {sendBack ? (
        <section className={card}>
          <h2 className="text-lg font-semibold">{sendBack === "reject" ? "Send back for changes" : "Take off the globe"}</h2>
          <p className="mt-1 text-sm text-black/60">
            {sendBack === "reject"
              ? "The Ambassador sees your note on the story and in an email, and can edit and send it again."
              : "The story leaves the globe straight away. The Ambassador sees your note and can edit and send it again."}
          </p>
          <form action={run} className="mt-4 grid gap-3">
            <Hidden storyId={storyId} version={version} verb={sendBack} />
            <label className="grid gap-2 text-sm font-semibold">
              Note for the Ambassador
              <textarea name="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={600} className={area} />
              <span className={`text-xs font-normal ${[...reason].length > 500 ? "text-magenta" : "text-black/50"}`}>{[...reason].length} / 500. Write in a language they read.</span>
            </label>
            <div>
              {sendBack === "takedown" ? (
                <ConfirmSubmit
                  className={buttonClass("danger")}
                  confirmVariant="danger"
                  pendingLabel="Taking down"
                  title="Take this story off the globe?"
                  message="It stops showing on the home page within a few minutes."
                  confirmLabel="Take down"
                >
                  Take off the globe
                </ConfirmSubmit>
              ) : (
                <SubmitButton className={buttonClass("solid")} pendingLabel="Sending">Send back with note</SubmitButton>
              )}
            </div>
          </form>
        </section>
      ) : null}

      {verbs.includes("move") ? (
        <section className={card}>
          <h2 className="text-lg font-semibold">Move the pin</h2>
          <p className="mt-1 text-sm text-black/60">If the place is wrong, choose the right city or town. The Ambassador isn&rsquo;t emailed.</p>
          <form action={run} className="mt-4 grid gap-3">
            <Hidden storyId={storyId} version={version} verb="move" />
            <PlacePicker name="placeId" label="New place" initial={place} searchUrl="/admin/stories/places" />
            <div>
              <SubmitButton className={buttonClass("outline")} pendingLabel="Moving">Move pin</SubmitButton>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
