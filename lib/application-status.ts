import type { Store } from "@/lib/db";
import { lockApplicant, transition } from "@/lib/lifecycle";

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
  if (current.status !== "round1_complete" && !(current.status === "id_failed" && target === "id_verified")) {
    return false;
  }
  const result = await transition(tx, {
    applicantId,
    to: target,
    actor: "identity",
    reason: `identity check ${current.identityStatus}`,
  });
  return result.ok;
}
