import { pins as demoPins, type Pin, type PinGroup } from "@/lib/pins";

// The globe's Ambassador pins as plain data: what the server reads
// (lib/ambassador/globe.ts) and what the home page section renders. No
// database or cache code, so client components can import it.

const EXCERPT_MAX = 280;

export type GlobeCard = {
  readonly pinId: string;
  readonly group: PinGroup;
  readonly title: string;
  readonly city: string;
  readonly country: string;
  readonly author: string | null;
  readonly excerpt: string | null;
  readonly photo: string | null;
  readonly language: string | null;
  readonly publishedAt: string | null;
};

export type GlobeData = {
  /** Pins from Ambassadors, by group. Empty when none, or when the read failed. */
  readonly pins: readonly Pin[];
  readonly cards: Readonly<Record<string, GlobeCard>>;
};

export const EMPTY_GLOBE: GlobeData = { pins: [], cards: {} };

export function excerpt(body: string, max = EXCERPT_MAX): string {
  const flat = body.replace(/\s+/g, " ").trim();
  const chars = [...flat];
  if (chars.length <= max) return flat;
  const cut = chars.slice(0, max).join("");
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?-]+$/, "")}…`;
}

// Pins at the same spot would sit exactly on top of each other. Each extra pin
// at a spot is nudged around a small circle (about 15 km), the same way every
// render, so the globe never jumps.
export function spread<T extends { lat: number; lng: number }>(items: readonly T[]): T[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const key = `${item.lat.toFixed(2)},${item.lng.toFixed(2)}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    if (n === 0) return item;
    const angle = n * 2.399963; // golden angle, so nudges never line up
    const radius = 0.14 * Math.sqrt(n);
    const lat = Math.max(-89, Math.min(89, item.lat + radius * Math.sin(angle)));
    const lng = item.lng + (radius * Math.cos(angle)) / Math.max(0.2, Math.cos((item.lat * Math.PI) / 180));
    return { ...item, lat, lng: ((lng + 540) % 360) - 180 };
  });
}

export type GlobeRows = {
  readonly stories: readonly {
    id: string;
    kind: "beacon" | "mission";
    title: string | null;
    body: string | null;
    city: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
    language: string;
    hasPhoto: boolean;
    publishedAt: Date | null;
    author: string;
  }[];
  readonly people: readonly {
    id: string;
    name: string;
    bio: string | null;
    city: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
  }[];
};

export function buildGlobe(rows: GlobeRows): GlobeData {
  const cards: Record<string, GlobeCard> = {};
  const items: (Pin & { card: GlobeCard })[] = [];
  for (const story of rows.stories) {
    if (story.lat == null || story.lng == null || !story.title || !story.city || !story.country) continue;
    const pinId = `story-${story.id}`;
    const group: PinGroup = story.kind === "beacon" ? "beacons" : "missions";
    const photo = story.hasPhoto ? `/api/stories/${story.id}/photo` : null;
    const card: GlobeCard = {
      pinId,
      group,
      title: story.title,
      city: story.city,
      country: story.country,
      author: story.author,
      excerpt: story.body ? excerpt(story.body) : null,
      photo,
      language: story.language,
      publishedAt: story.publishedAt ? story.publishedAt.toISOString() : null,
    };
    const base = { id: pinId, group, city: story.city, lat: story.lat, lng: story.lng };
    items.push(photo ? { ...base, kind: "photo", image: photo, card } : { ...base, kind: "icon", card });
  }
  for (const person of rows.people) {
    if (person.lat == null || person.lng == null || !person.city || !person.country) continue;
    const pinId = `ambassador-${person.id}`;
    const card: GlobeCard = {
      pinId,
      group: "ambassadors",
      title: person.name,
      city: person.city,
      country: person.country,
      author: null,
      excerpt: person.bio,
      photo: null,
      language: null,
      publishedAt: null,
    };
    items.push({ id: pinId, kind: "icon", group: "ambassadors", city: person.city, lat: person.lat, lng: person.lng, card });
  }
  const pins = spread(items).map(({ card, ...pin }) => {
    cards[pin.id] = card;
    return pin as Pin;
  });
  return { pins, cards };
}

// A group with at least one real pin shows only real pins; a group with none
// keeps its demo pins, so the globe is never emptier than before.
export function globePins(live: readonly Pin[], demo: readonly Pin[] = demoPins): Pin[] {
  const liveGroups = new Set(live.map((pin) => pin.group));
  return [...demo.filter((pin) => !liveGroups.has(pin.group)), ...live];
}
