import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { authenticateOperator } from "@/lib/operations-auth";
import { STATUSES } from "@/lib/lifecycle";
import { applicantDetail, overview, performAction } from "@/lib/ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Team-only. GET  /api/ops                 → the overview of stuck work
//            GET  /api/ops?applicant=<id>  → one applicant's history and jobs
//            POST /api/ops                 → one controlled recovery action
// Individual bearer credentials are mapped to principals on the server.

const actionInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("retry_job"), jobId: z.uuid() }),
  z.object({ action: z.literal("provision_identity"), applicantId: z.uuid() }),
  z.object({ action: z.literal("send_resume_link"), applicantId: z.uuid() }),
  z.object({
    action: z.literal("transition"),
    applicantId: z.uuid(),
    to: z.enum(STATUSES),
    reason: z.string().trim().min(3).max(500),
    expectedVersion: z.number().int().nonnegative().optional(),
  }),
]);

export async function GET(req: NextRequest) {
  if (!authenticateOperator(req.headers)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const applicantId = req.nextUrl.searchParams.get("applicant");
  if (applicantId) {
    const detail = await applicantDetail(db, applicantId);
    return detail ? NextResponse.json(detail) : NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(await overview(db));
}

export async function POST(req: NextRequest) {
  const operator = authenticateOperator(req.headers);
  if (!operator) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = actionInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const result = await performAction(getDb(), parsed.data, operator);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
