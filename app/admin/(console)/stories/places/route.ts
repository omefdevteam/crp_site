import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { searchCities } from "@/lib/places/search";
import { STAFF_COOKIE, readStaff } from "@/lib/staff/auth";
import { can } from "@/lib/staff/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };

// City suggestions for moving a story's pin. Under /admin so the staff cookie
// (path /admin) is sent.
export async function GET(request: NextRequest) {
  const jar = await cookies();
  const staff = await readStaff(getDb(), jar.get(STAFF_COOKIE)?.value);
  if (!staff || !can(staff.role, "stories.review")) return Response.json({ places: [] }, { status: 401, headers: HEADERS });
  const country = request.nextUrl.searchParams.get("country") ?? "";
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  if (!/^[A-Z]{2}$/.test(country)) return Response.json({ places: [] }, { status: 400, headers: HEADERS });
  return Response.json({ places: searchCities(country, q, 8) }, { headers: HEADERS });
}
