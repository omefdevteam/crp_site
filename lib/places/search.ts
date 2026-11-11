import rows from "@/lib/places/cities.json";

// City lookup for story places, from GeoNames (CC BY 4.0, credited next to the
// city field). Built by scripts/build-cities.mjs. Server only: the file is
// 1.5 MB and the browser asks /api/places for a handful of matches.
//
// A place is chosen by its id (its row number), and the server reads the name
// and coordinates back from this file. So a story's map point always comes
// from the list, never from what a browser sends.
type Row = readonly [name: string, ascii: string, country: string, lat: number, lng: number, population: number];

export type Place = {
  readonly id: number;
  readonly name: string;
  readonly country: string;
  readonly lat: number;
  readonly lng: number;
};

const CITIES = rows as unknown as readonly Row[];

export function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

type Indexed = { id: number; row: Row; keys: readonly string[] };

let byCountry: Map<string, Indexed[]> | null = null;

function index(): Map<string, Indexed[]> {
  if (byCountry) return byCountry;
  byCountry = new Map();
  CITIES.forEach((row, id) => {
    const keys = [fold(row[0]), ...(row[1] ? [fold(row[1])] : [])];
    const list = byCountry!.get(row[2]) ?? [];
    list.push({ id, row, keys });
    byCountry!.set(row[2], list);
  });
  return byCountry;
}

function toPlace({ id, row }: Indexed): Place {
  return { id, name: row[0], country: row[2], lat: row[3], lng: row[4] };
}

// Cities in one country whose name starts with the query come first, then
// names with a word starting with it. Each group keeps the population order.
export function searchCities(country: string, query: string, limit = 8): Place[] {
  const list = index().get(country.toUpperCase());
  const q = fold(query);
  if (!list || q.length === 0) return [];
  const starts: Indexed[] = [];
  const words: Indexed[] = [];
  for (const city of list) {
    if (city.keys.some((key) => key.startsWith(q))) starts.push(city);
    else if (city.keys.some((key) => key.includes(` ${q}`))) words.push(city);
    if (starts.length >= limit) break;
  }
  return [...starts, ...words].slice(0, limit).map(toPlace);
}

export function placeById(id: number): Place | null {
  if (!Number.isInteger(id) || id < 0 || id >= CITIES.length) return null;
  const row = CITIES[id];
  return row ? { id, name: row[0], country: row[2], lat: row[3], lng: row[4] } : null;
}

// The largest city in a country with exactly this name, for a story that was
// saved with a name but no list id.
export function placeByName(country: string, name: string): Place | null {
  const q = fold(name);
  const hit = index().get(country.toUpperCase())?.find((city) => city.keys.includes(q));
  return hit ? toPlace(hit) : null;
}

export const PLACE_CREDIT = "Place data © GeoNames (CC BY 4.0)";
