import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { storyPhotoStoreFromEnv } from "@/lib/ambassador/photo-store";
import { photoFor } from "@/lib/ambassador/stories";
import { STAFF_COOKIE, readStaff } from "@/lib/staff/auth";
import { can } from "@/lib/staff/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "cache-control": "private, no-store",
  "referrer-policy": "no-referrer",
  "cross-origin-resource-policy": "same-origin",
  "x-content-type-options": "nosniff",
};

// Staff see a story's photo before it is approved, to decide whether it can go
// on the globe. Under /admin so the staff cookie is sent.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const db = getDb();
  const staff = await readStaff(db, jar.get(STAFF_COOKIE)?.value);
  if (!staff || !can(staff.role, "stories.review")) return new Response("Not found", { status: 404, headers: HEADERS });
  const { id } = await params;
  const photo = await photoFor(db, id, { kind: "staff" });
  const store = storyPhotoStoreFromEnv();
  if (!photo || !store) return new Response("Not found", { status: 404, headers: HEADERS });
  const body = await store.read(photo.pathname).catch(() => null);
  if (!body) return new Response("Not found", { status: 404, headers: HEADERS });
  return new Response(body, { headers: { ...HEADERS, "content-type": photo.contentType, "content-length": String(photo.byteSize) } });
}
