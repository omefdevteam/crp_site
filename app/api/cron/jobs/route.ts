import { NextResponse, type NextRequest } from "next/server";
import { secretOk } from "@/lib/api-auth";
import { tick } from "@/lib/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The background worker. Vercel Cron calls this every minute with the CRON_SECRET
// bearer token; it can also be run by hand (or from the ops screen) to drain the
// queue immediately.
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const provided = bearer ?? req.headers.get("x-cron-secret");
  if (!secretOk(provided, process.env.CRON_SECRET) && !secretOk(provided, process.env.OPERATIONS_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 25));
  const summary = await tick(limit);
  return NextResponse.json({ ok: true, ...summary });
}

export const POST = GET;
