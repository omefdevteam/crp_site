import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getIdentityProvider } from "@/lib/identity";
import { bodyHash, ingestWebhook } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sessions created before the callback fix still return here in the browser.
// This compatibility redirect never treats query parameters as a decision.
export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/apply/complete", req.nextUrl.origin));
}

const KEPT_HEADERS = ["x-timestamp", "x-signature"];

export async function POST(req: NextRequest) {
  const provider = getIdentityProvider();

  // The signature is over the exact bytes received, so read the raw body and
  // verify before parsing it as JSON.
  const raw = await req.text();
  if (!provider.verify(raw, req.headers)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = provider.parse(body, req.headers);
  if (!event.reference && !event.sessionId) {
    return NextResponse.json({ error: "missing reference" }, { status: 400 });
  }

  // Only the headers the parser reads are kept alongside the body, so a retry
  // from the worker sees exactly what the live request saw.
  const headers: Record<string, string> = {};
  for (const name of KEPT_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers[name] = value;
  }

  const key = event.eventId ?? bodyHash(raw);
  const ingest = await ingestWebhook(getDb(), "identity", `${provider.name}:${key}`, { body, headers });
  if (ingest.queued) return NextResponse.json({ ok: true, queued: true }, { status: 202 });
  return NextResponse.json({
    ok: true,
    duplicate: ingest.duplicate,
    outcome: ingest.result?.outcome ?? null,
    advanced: ingest.result?.advanced ?? false,
  });
}
