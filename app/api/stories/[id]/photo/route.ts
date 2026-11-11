import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { MEMBER_COOKIE, readMember } from "@/lib/ambassador/auth";
import { storyPhotoStoreFromEnv } from "@/lib/ambassador/photo-store";
import { PHOTO_MAX_BYTES } from "@/lib/ambassador/story-model";
import { photoFor, removeStoryPhoto, setStoryPhoto } from "@/lib/ambassador/stories";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { staffSameOrigin } from "@/lib/staff/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const BASE = { "x-content-type-options": "nosniff", "cross-origin-resource-policy": "same-site" };

function missing(): Response {
  return new Response("Not found", { status: 404, headers: { ...BASE, "cache-control": "private, no-store" } });
}

// An approved story's photo is public and briefly cacheable. Before approval
// only its own Ambassador sees it; staff open it from the admin console.
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  let photo = await photoFor(db, id, { kind: "public" });
  if (!photo) {
    const jar = await cookies();
    const member = await readMember(db, jar.get(MEMBER_COOKIE)?.value);
    if (member) photo = await photoFor(db, id, { kind: "member", ambassadorId: member.id });
  }
  if (!photo) return missing();
  const store = storyPhotoStoreFromEnv();
  if (!store) return missing();
  const body = await store.read(photo.pathname).catch(() => null);
  if (!body) return missing();
  return new Response(body, {
    headers: {
      ...BASE,
      "content-type": photo.contentType,
      "content-length": String(photo.byteSize),
      // A withdrawn story stops showing within five minutes.
      "cache-control": photo.public ? "public, max-age=300, s-maxage=300" : "private, no-store",
    },
  });
}

function answer(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { ...BASE, "cache-control": "private, no-store" } });
}

const STATUS: Record<string, number> = { not_found: 404, locked: 409, photo_type: 415, photo_size: 413, no_store: 503 };

async function member(request: Request) {
  if (!staffSameOrigin(request.headers)) return null;
  const jar = await cookies();
  return readMember(getDb(), jar.get(MEMBER_COOKIE)?.value);
}

// Upload or replace the photo of the Ambassador's own story. A route handler,
// not a Server Action, so the size limit is ours (Vercel allows 4.5 MB).
export async function POST(request: Request, { params }: Params) {
  const me = await member(request);
  if (!me) return answer(401, { reason: "signed_out" });
  if (!(await rateLimit("story-photo:member", me.id, 30, 3600)) || !(await rateLimit("story-photo:ip", clientIp(request.headers), 60, 3600))) {
    return answer(429, { reason: "busy" });
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > PHOTO_MAX_BYTES + 64 * 1024) return answer(413, { reason: "photo_size" });
  let file: File | null = null;
  try {
    const value = (await request.formData()).get("photo");
    file = value instanceof File ? value : null;
  } catch {
    return answer(400, { reason: "photo_type" });
  }
  if (!file) return answer(400, { reason: "photo_type" });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { id } = await params;
  const result = await setStoryPhoto(getDb(), me, id, storyPhotoStoreFromEnv(), { bytes, size: bytes.length });
  if (!result.ok) return answer(STATUS[result.reason] ?? 400, { reason: result.reason });
  return answer(200, { ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const me = await member(request);
  if (!me) return answer(401, { reason: "signed_out" });
  const { id } = await params;
  const result = await removeStoryPhoto(getDb(), me, id, storyPhotoStoreFromEnv());
  if (!result.ok) return answer(STATUS[result.reason] ?? 400, { reason: result.reason });
  return answer(200, { ok: true });
}
