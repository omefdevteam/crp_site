import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { secretOk } from "@/lib/api-auth";
import { bodyHash, ingestWebhook } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGES = new Set(["round1", "round2"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// VideoAsk nests the applicant id differently per payload — sometimes a direct
// `applicant_id` key, sometimes a {name/label: "applicant_id", value: "..."}
// variable pair. Find it whichever shape it takes.
function findApplicantId(node: unknown): string | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findApplicantId(item);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;

  if (typeof obj.applicant_id === "string") return obj.applicant_id;

  const label = obj.name ?? obj.label ?? obj.variable;
  if (label === "applicant_id") {
    const value = obj.value ?? obj.input_text ?? obj.transcript;
    if (typeof value === "string") return value;
  }

  for (const value of Object.values(obj)) {
    const found = findApplicantId(value);
    if (found) return found;
  }
  return null;
}

// VideoAsk's own id for a response, when present; otherwise the body hash, which
// still recognises an exact redelivery.
function eventKey(body: unknown, raw: string, stage: string): string {
  const b = (body ?? {}) as Record<string, unknown>;
  const fr = (b.form_response ?? {}) as Record<string, unknown>;
  const id = [b.event_id, fr.form_response_id, fr.id, b.form_response_id].find((v) => typeof v === "string" && v);
  return `${stage}:${id ?? bodyHash(raw)}`;
}

export async function POST(req: NextRequest) {
  const secret =
    req.headers.get("x-webhook-secret") ?? req.nextUrl.searchParams.get("key");
  if (!secretOk(secret, process.env.VIDEOASK_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raw = await req.text();
  let body: unknown = null;
  try { body = JSON.parse(raw); } catch { body = null; }
  const applicantId = findApplicantId(body);
  const requested = req.nextUrl.searchParams.get("stage") ?? "";
  const stage = STAGES.has(requested) ? requested : "";
  if (!applicantId || !UUID_RE.test(applicantId)) {
    console.warn(
      "[videoask] missing applicant_id; stage:",
      requested,
      "top-level keys:",
      body && typeof body === "object" ? Object.keys(body).join(",") : typeof body,
    );
    return NextResponse.json({ error: "missing applicant_id or stage" }, { status: 400 });
  }
  if (requested && !STAGES.has(requested)) {
    console.warn("[videoask] unknown stage:", requested);
    return NextResponse.json({ error: "missing applicant_id or stage" }, { status: 400 });
  }

  const ingest = await ingestWebhook(getDb(), "videoask", eventKey(body, raw, stage || "auto"), { stage, applicantId, body });
  if (ingest.queued) return NextResponse.json({ ok: true, queued: true }, { status: 202 });
  return NextResponse.json({
    ok: true,
    duplicate: ingest.duplicate,
    status: ingest.result?.status ?? null,
    advanced: ingest.result?.advanced ?? false,
  });
}
