// Builds lib/places/cities.json from the GeoNames cities15000 dump.
//
//   1. Download https://download.geonames.org/export/dump/cities15000.zip
//   2. Unzip it, then run: node scripts/build-cities.mjs path/to/cities15000.txt
//
// GeoNames data is CC BY 4.0. The site credits it next to the city field.
// Each row is [name, ascii name, country code, lat, lng, population], grouped by
// country and sorted by population, so a search can stop early.
import fs from "node:fs";

const source = process.argv[2];
if (!source) {
  console.error("usage: node scripts/build-cities.mjs cities15000.txt");
  process.exit(1);
}

const round = (value) => Math.round(Number(value) * 1000) / 1000;
const rows = [];
for (const line of fs.readFileSync(source, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const f = line.split("\t");
  const [name, ascii, country, lat, lng, population] = [f[1], f[2], f[8], f[4], f[5], Number(f[14]) || 0];
  if (!name || !/^[A-Z]{2}$/.test(country ?? "")) continue;
  rows.push([name.slice(0, 100), ascii && ascii !== name ? ascii.slice(0, 100) : "", country, round(lat), round(lng), population]);
}
rows.sort((a, b) => a[2].localeCompare(b[2]) || b[5] - a[5] || a[0].localeCompare(b[0]));

fs.mkdirSync("lib/places", { recursive: true });
fs.writeFileSync("lib/places/cities.json", `${JSON.stringify(rows)}\n`);
console.log(`wrote ${rows.length} cities`);
