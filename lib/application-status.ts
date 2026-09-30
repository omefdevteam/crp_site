import type { Store } from "@/lib/db";
import { lockApplicant, transition, updateApplicant } from "@/lib/lifecycle";

// Both webhook paths call this after storing their part of the result, inside
// their transaction. The applicant row is locked, so however the Round 1 and
// identity deliveries interleave, exactly one of them moves the pipeline on and
// a late delivery cannot undo a later stage.
export async function reconcileIdentity(tx: Store, applicantId: string): Promise<boolean> {
  const current = await lockApplicant(tx, applicantId);
  if (!current) return false;
  const target =
    current.identityStatus === "verified" ? "id_verified"
    : current.identityStatus === "failed" ? "id_failed"
    : null;
  if (!target) return false;

  if (target === "id_failed") {
    // First failure from Round 1, or another failure while already retrying.
    if (current.status !== "round1_complete" && current.status !== "id_failed") return false;
    if (current.status === "round1_complete") {
      const result = await transition(tx, {
        applicantId,
        to: "id_failed",
        actor: "identity",
        reason: `identity check ${current.identityStatus}`,
      });
      if (!result.ok) return false;
    }
    // provisionIdentitySession is idempotent on identityLink. Drop the dead
    // session so the retry job (and ops re-queue) can mint a fresh Didit link.
    await updateApplicant(tx, applicantId, {
      identityLink: null,
      identitySessionId: null,
    });
    return true;
  }

  if (current.status !== "round1_complete" && !(current.status === "id_failed" && target === "id_verified")) {
    return false;
  }
  const result = await transition(tx, {
    applicantId,
    to: target,
    actor: "identity",
    reason: `identity check ${current.identityStatus}`,
  });
  if (!result.ok) return false;
  const review = await transition(tx, {
    applicantId,
    to: "under_review",
    actor: "identity",
    reason: "identity verified; application ready for review",
    allowFrom: ["id_verified"],
  });
  return review.ok;
}
