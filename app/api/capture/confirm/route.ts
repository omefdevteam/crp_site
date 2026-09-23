import { NextResponse, type NextRequest } from "next/server";
import { confirmationPage } from "@/lib/confirmation-page";
import { confirmCapture } from "@/lib/capture-confirmation";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return confirmationPage(req.nextUrl.searchParams.get("token") ?? "", "/api/capture/confirm", "Confirm your request / Confirmer votre demande");
}
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  if (!(await rateLimit("capture:confirm", clientIp(req.headers), 30))) return NextResponse.json({ error: "too many attempts" }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const token = form?.get("token");
  const ok = typeof token === "string" && await confirmCapture(getDb(), token);
  return NextResponse.redirect(new URL(`/confirmation?result=${ok ? "confirmed" : "expired"}`, req.nextUrl.origin), 303);
}
