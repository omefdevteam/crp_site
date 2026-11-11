import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { MEMBER_COOKIE, readMember } from "@/lib/ambassador/auth";
import { searchCities } from "@/lib/places/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };

// City suggestions for the story and profile forms. Signed-in Ambassadors only,
// so the endpoint is not an open geocoder.
export async function GET(request: NextRequest) {
  const jar = await cookies();
  if (!(await readMember(getDb(), jar.get(MEMBER_COOKIE)?.value))) {
    return Response.json({ places: [] }, { status: 401, headers: HEADERS });
  }
  const country = request.nextUrl.searchParams.get("country") ?? "";
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  if (!/^[A-Z]{2}$/.test(country)) return Response.json({ places: [] }, { status: 400, headers: HEADERS });
  return Response.json({ places: searchCities(country, q, 8) }, { headers: HEADERS });
}
