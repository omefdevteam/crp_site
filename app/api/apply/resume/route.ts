import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { applicants, getDb } from "@/lib/db";
import { consumeAccessToken } from "@/lib/access";
import { nextStepUrl } from "@/lib/application";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The landing point of a "continue your application" email. The token works
// once and briefly; spending it opens a signed session and forwards the
// applicant to whatever their next step currently is.
export async function GET(req: NextRequest) {
  const home = new URL("/apply?resume=expired", req.nextUrl.origin);
  if (!(await rateLimit("resume:ip", clientIp(req.headers), 30, 3600))) {
    return NextResponse.redirect(home);
  }
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const db = getDb();
  const applicantId = await db.transaction((tx) => consumeAccessToken(tx, token, "resume"));
  if (!applicantId) return NextResponse.redirect(home);

  const [applicant] = await db.select().from(applicants).where(eq(applicants.id, applicantId));
  if (!applicant) return NextResponse.redirect(home);

  const res = NextResponse.redirect(nextStepUrl(applicant));
  res.cookies.set(SESSION_COOKIE, signSession(applicantId), sessionCookieOptions());
  return res;
}
