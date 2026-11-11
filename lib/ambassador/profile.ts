import { eq } from "drizzle-orm";
import { ambassadors, type Ambassador, type Db } from "@/lib/db";
import { placeById, placeByName, type Place } from "@/lib/places/search";
import type { ProfileInput } from "@/lib/ambassador/story-model";

export type Profile = Pick<Ambassador, "displayName" | "bio" | "homeCountry" | "homeCity" | "showOnGlobe" | "language"> & {
  readonly home: Place | null;
};

export async function getProfile(db: Db, ambassadorId: string): Promise<Profile | null> {
  const [row] = await db
    .select({
      displayName: ambassadors.displayName,
      bio: ambassadors.bio,
      homeCountry: ambassadors.homeCountry,
      homeCity: ambassadors.homeCity,
      homeLat: ambassadors.homeLat,
      homeLng: ambassadors.homeLng,
      showOnGlobe: ambassadors.showOnGlobe,
      language: ambassadors.language,
    })
    .from(ambassadors)
    .where(eq(ambassadors.id, ambassadorId));
  if (!row) return null;
  const home = row.homeCountry && row.homeCity && row.homeLat != null && row.homeLng != null
    ? placeByName(row.homeCountry, row.homeCity) ?? { id: -1, name: row.homeCity, country: row.homeCountry, lat: row.homeLat, lng: row.homeLng }
    : null;
  return {
    displayName: row.displayName,
    bio: row.bio,
    homeCountry: row.homeCountry,
    homeCity: row.homeCity,
    showOnGlobe: row.showOnGlobe,
    language: row.language,
    home,
  };
}

export type ProfileResult = { ok: true } | { ok: false; reason: "place" | "not_found" };

// A home of "keep" leaves the saved home as it is. null clears it, and with it
// the globe opt-in.
export async function updateProfile(db: Db, ambassadorId: string, input: ProfileInput): Promise<ProfileResult> {
  let home: { homeCountry: string | null; homeCity: string | null; homeLat: number | null; homeLng: number | null } | null = null;
  if (input.homePlaceId !== "keep") {
    if (input.homePlaceId === null) {
      home = { homeCountry: null, homeCity: null, homeLat: null, homeLng: null };
    } else {
      const place = placeById(input.homePlaceId);
      if (!place) return { ok: false, reason: "place" };
      home = { homeCountry: place.country, homeCity: place.name, homeLat: place.lat, homeLng: place.lng };
    }
  }
  const updated = await db
    .update(ambassadors)
    .set({
      displayName: input.displayName,
      bio: input.bio,
      language: input.language,
      showOnGlobe: home && home.homeLat === null ? false : input.showOnGlobe,
      ...(home ?? {}),
    })
    .where(eq(ambassadors.id, ambassadorId))
    .returning({ id: ambassadors.id });
  return updated.length > 0 ? { ok: true } : { ok: false, reason: "not_found" };
}
