import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { applicants, getDb } from "@/lib/db";
import { provisionIdentitySession } from "@/lib/application";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const home = new URL("/apply", req.nextUrl.origin);
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.redirect(home);
  const db = getDb();
  const [applicant] = await db.select().from(applicants).where(eq(applicants.id, session.applicantId));
  if (!applicant?.emailVerifiedAt || applicant.sessionVersion !== session.version) return NextResponse.redirect(home);
  if (!(await rateLimit("verify:applicant", applicant.id, 30, 3600)) || !(await rateLimit("verify:ip", clientIp(req.headers), 30, 3600))) return NextResponse.redirect(home);
  // A browser redirect proves neither completion nor approval. Wait for the
  // authenticated, form-bound VideoAsk event before provisioning identity.
  if (!["round1_complete", "id_failed"].includes(applicant.status)) {
    return NextResponse.redirect(new URL("/apply/complete", req.nextUrl.origin));
  }
  const { url } = await provisionIdentitySession(db, applicant.id);
  return NextResponse.redirect(url ?? new URL("/apply/complete", req.nextUrl.origin));
}
