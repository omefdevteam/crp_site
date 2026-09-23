import assert from "node:assert/strict";
import test from "node:test";
import { loader } from "./helpers.mjs";

const { COUNTRIES, findCountry, rankCountries } = loader()("lib/countries.ts");
const label = (country) => country.name;

test("country list covers the usual countries with dial codes and unique codes", () => {
  assert.ok(COUNTRIES.length >= 190);
  assert.equal(new Set(COUNTRIES.map((country) => country.code)).size, COUNTRIES.length);
  for (const country of COUNTRIES) assert.match(country.dial, /^\+\d{1,3}$/);
  assert.equal(findCountry("GH").name, "Ghana");
  assert.equal(findCountry("GH").dial, "+233");
  assert.equal(findCountry("US").dial, "+1");
  assert.equal(findCountry("GB").dial, "+44");
});

test("typing ranks the closest country first", () => {
  assert.equal(rankCountries(COUNTRIES, "gha", label)[0].code, "GH");
  assert.equal(rankCountries(COUNTRIES, "usa", label)[0].code, "US");
  assert.equal(rankCountries(COUNTRIES, "us", label)[0].code, "US");
  assert.equal(rankCountries(COUNTRIES, "+233", label)[0].code, "GH");
  assert.equal(rankCountries(COUNTRIES, "ivory", label)[0].code, "CI");
  assert.equal(rankCountries(COUNTRIES, "turk", label)[0].code, "TR");
  assert.equal(rankCountries(COUNTRIES, "america", label)[0].code, "US");
  assert.equal(rankCountries(COUNTRIES, "uk", label)[0].code, "GB");
  assert.deepEqual(
    rankCountries(COUNTRIES, "united", label).slice(0, 3).map((country) => country.code),
    ["AE", "GB", "US"],
  );
  assert.equal(rankCountries(COUNTRIES, "zzzqq", label).length, 0);
  const all = rankCountries(COUNTRIES, " ", label);
  assert.equal(all.length, COUNTRIES.length);
  const ordered = all.every((country, index) => index === 0 || all[index - 1].name.localeCompare(country.name, undefined, { sensitivity: "base" }) <= 0);
  assert.equal(ordered, true);
});
