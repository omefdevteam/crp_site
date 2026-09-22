import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { completeRound1FromRedirect, provisionIdentitySession } from "@/lib/application";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The seamless hand-off from Round 1. VideoAsk's completion redirect lands
// here; the signed session cookie set at apply time (or by a resume link) says
// who the applicant is. The `applicant_id` VideoAsk echoes back is not trusted
// as authorization: an id identifies a record, the session proves it is yours.
export async function GET(req: NextRequest) {
  const home = new URL("/apply", req.nextUrl.origin);
  const applicantId = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!applicantId) {
    console.warn("[verify] no valid session; redirecting to apply");
    return NextResponse.redirect(home);
  }
  if (!(await rateLimit("verify:ip", clientIp(req.headers), 30, 3600))) {
    return NextResponse.redirect(home);
  }

  const db = getDb();
  await completeRound1FromRedirect(db, applicantId);

  // Reuses an existing session so a refresh or a double-fire never starts a
  // second verification. Provider down/misconfigured: fall back to the site;
  // the queued identity email (retried by the worker) is the backstop.
  const { url } = await provisionIdentitySession(db, applicantId);
  if (!url) {
    console.warn("[verify] identity session unavailable for", applicantId);
    return NextResponse.redirect(new URL("/apply/complete", req.nextUrl.origin));
  }
  return NextResponse.redirect(url);
}
