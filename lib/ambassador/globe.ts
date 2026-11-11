import { cache } from "react";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { ambassadors, applicants, getDb, stories, type Db } from "@/lib/db";
import { cachedRenderPhase } from "@/lib/copy/read";
import { rateLimitedWarn, shortReason, withTimeout } from "@/lib/copy/resilience";
import { isMissingTable } from "@/lib/logos/read";
import { EMPTY_GLOBE, buildGlobe, type GlobeData } from "@/lib/ambassador/globe-model";
import { AMBASSADOR_STATUSES } from "@/lib/ambassador/status";

// What the home page globe shows from Ambassadors: approved stories (Beacons
// and Missions) and Ambassadors who chose to appear at their home city. Only
// active Ambassadors count, so a later rejection takes their pins off too.
//
// Read through the shared data cache, tagged "globe", and refreshed with the
// page every 10 minutes or straight away when staff decide (expireGlobe). If
// the read fails, the globe shows exactly what it showed before this feature:
// the built-in demo pins.

export const GLOBE_TAG = "globe";
const REVALIDATE_SECONDS = 600;
const FALLBACK_REVALIDATE_SECONDS = 60;
const DEADLINE_MS = 4_000;
const PER_GROUP_MAX = 150;

export type { GlobeCard, GlobeData } from "@/lib/ambassador/globe-model";

export async function queryGlobe(db: Db): Promise<GlobeData> {
  const activeAuthor = and(isNull(ambassadors.disabledAt), inArray(applicants.status, [...AMBASSADOR_STATUSES]));
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('statement_timeout', '3000', true)`);
      const storyRows = await Promise.all((["beacon", "mission"] as const).map((kind) =>
        tx
          .select({
            id: stories.id,
            kind: stories.kind,
            title: stories.title,
            body: stories.body,
            city: stories.city,
            country: stories.country,
            lat: stories.lat,
            lng: stories.lng,
            language: stories.language,
            photo: stories.photoPathname,
            publishedAt: stories.publishedAt,
            author: ambassadors.displayName,
          })
          .from(stories)
          .innerJoin(ambassadors, eq(ambassadors.id, stories.ambassadorId))
          .innerJoin(applicants, eq(applicants.id, ambassadors.applicantId))
          .where(and(eq(stories.status, "approved"), eq(stories.kind, kind), activeAuthor))
          .orderBy(desc(stories.publishedAt))
          .limit(PER_GROUP_MAX)));
      const people = await tx
        .select({
          id: ambassadors.id,
          name: ambassadors.displayName,
          bio: ambassadors.bio,
          city: ambassadors.homeCity,
          country: ambassadors.homeCountry,
          lat: ambassadors.homeLat,
          lng: ambassadors.homeLng,
        })
        .from(ambassadors)
        .innerJoin(applicants, eq(applicants.id, ambassadors.applicantId))
        .where(and(eq(ambassadors.showOnGlobe, true), isNotNull(ambassadors.homeLat), activeAuthor))
        .orderBy(desc(ambassadors.createdAt))
        .limit(PER_GROUP_MAX);
      return buildGlobe({
        stories: storyRows.flat().map(({ photo, ...row }) => ({ ...row, hasPhoto: Boolean(photo) })),
        people,
      });
    });
  } catch (err) {
    // Before migration 0021: no tables means nothing to show yet.
    if (isMissingTable(err)) return EMPTY_GLOBE;
    throw err;
  }
}

const warn = rateLimitedWarn(5 * 60_000);

export type GlobeSourceOptions = {
  query: () => Promise<GlobeData>;
  cache?: (refresh: () => Promise<GlobeData>) => () => Promise<GlobeData>;
  deadlineMs: number;
  shortenPageLifetime?: () => Promise<unknown> | unknown;
  log?: (key: string, line: string) => void;
};

export function createGlobeSource(options: GlobeSourceOptions) {
  const log = options.log ?? warn;
  let lastGood: GlobeData | undefined;
  const cached = options.cache ? options.cache(options.query) : options.query;
  return async function read(): Promise<GlobeData> {
    try {
      const data = await withTimeout(cached(), options.deadlineMs, "globe read");
      lastGood = data;
      return data;
    } catch (err) {
      log("globe-read", `[globe] Ambassador pins unavailable (${shortReason(err)}); showing ${lastGood ? "the last good pins" : "the demo pins"}`);
      // A page rendered without the real pins only lives a minute.
      await options.shortenPageLifetime?.();
      return lastGood ?? EMPTY_GLOBE;
    }
  };
}

const readGlobe = createGlobeSource({
  query: () => queryGlobe(getDb()),
  cache: (refresh) => unstable_cache(refresh, ["globe-pins"], { tags: [GLOBE_TAG], revalidate: REVALIDATE_SECONDS }),
  deadlineMs: DEADLINE_MS,
  shortenPageLifetime: unstable_cache(async () => true, ["globe-fallback-ttl"], { tags: [GLOBE_TAG], revalidate: FALLBACK_REVALIDATE_SECONDS }),
});

/** The globe's Ambassador pins for the prerendered home page. */
export const publicGlobe = cache(async (): Promise<GlobeData> => {
  // During `next build` with no database, prerender the demo globe.
  if (cachedRenderPhase() === "build" && !process.env.DATABASE_URL) return EMPTY_GLOBE;
  return readGlobe();
});

// Called from the Server Actions that change what the globe shows: a staff
// decision, an Ambassador withdrawing a live story, a profile change.
export function expireGlobe(): void {
  try {
    updateTag(GLOBE_TAG);
    revalidatePath("/[lang]", "page");
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
  }
}
