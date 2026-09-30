import { createHash } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { ingestWebhook } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("calendly-webhook-signature");
  const eventKey = createHash("sha256").update(raw).digest("hex");
  const ingest = await ingestWebhook(getDb(), "calendly", eventKey, { raw, signature });
  return NextResponse.json(
    { ok: true, duplicate: ingest.duplicate, queued: ingest.queued, outcome: ingest.result?.outcome ?? null },
    { status: ingest.queued ? 202 : 200 },
  );
}
