import { and, eq, inArray, isNull } from "drizzle-orm";
import { appUrl } from "@/lib/config";
import { ambassadors, applicants, type Applicant, type Db, type Store } from "@/lib/db";
import { ambassadorWelcomeEmail } from "@/lib/emails";
import { enqueueEmail } from "@/lib/jobs";
import { findCountryByName } from "@/lib/countries";
import { parseLocale } from "@/lib/locale";
import { memberPath } from "@/lib/ambassador/link";
import { AMBASSADOR_STATUSES, isAmbassadorStatus } from "@/lib/ambassador/status";
import { parseEmail } from "@/lib/staff/users";

export const WELCOME_TEMPLATE = "ambassador_welcome";

// The name shown on the globe until the Ambassador changes it: the first word
// of their full name, so a surname is never published without their say.
export function defaultDisplayName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  return (first || "Ambassador").slice(0, 60);
}

type Source = Pick<Applicant, "id" | "email" | "fullName" | "basedIn" | "language" | "status">;

// Creates the Ambassador account for an applicant who has just reached an
// Ambassador status, and queues the welcome email in the same transaction.
// Safe to call again: an existing account (by applicant or email) is left as
// it is and no second email is queued. Returns true when an account was made.
export async function provisionAmbassador(tx: Store, applicant: Source): Promise<boolean> {
  if (!isAmbassadorStatus(applicant.status)) return false;
  const email = parseEmail(applicant.email);
  if (!email) return false;
  const language = parseLocale(applicant.language);
  const [created] = await tx
    .insert(ambassadors)
    .values({
      applicantId: applicant.id,
      email,
      displayName: defaultDisplayName(applicant.fullName),
      homeCountry: applicant.basedIn ? findCountryByName(applicant.basedIn)?.code ?? null : null,
      language,
      invitedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning({ id: ambassadors.id, displayName: ambassadors.displayName });
  if (!created) return false;
  const mail = ambassadorWelcomeEmail(language, created.displayName, `${appUrl()}${memberPath(language, "/sign-in")}`);
  await enqueueEmail(tx, `ambassador-welcome:${applicant.id}`, { to: email, ...mail }, WELCOME_TEMPLATE, applicant.id);
  return true;
}

// For applicants who were accepted before Ambassador accounts existed. Each
// applicant gets its own transaction, so one bad row does not stop the rest.
export async function backfillAmbassadors(db: Db): Promise<{ created: number }> {
  const missing = await db
    .select({ id: applicants.id })
    .from(applicants)
    .leftJoin(ambassadors, eq(ambassadors.applicantId, applicants.id))
    .where(and(inArray(applicants.status, [...AMBASSADOR_STATUSES]), isNull(ambassadors.id)));
  let created = 0;
  for (const { id } of missing) {
    const made = await db.transaction(async (tx) => {
      const [row] = await tx.select().from(applicants).where(eq(applicants.id, id)).for("update");
      return row ? provisionAmbassador(tx, row) : false;
    });
    if (made) created += 1;
  }
  return { created };
}

export async function countMissingAmbassadors(db: Store): Promise<number> {
  const rows = await db
    .select({ id: applicants.id })
    .from(applicants)
    .leftJoin(ambassadors, eq(ambassadors.applicantId, applicants.id))
    .where(and(inArray(applicants.status, [...AMBASSADOR_STATUSES]), isNull(ambassadors.id)));
  return rows.length;
}
