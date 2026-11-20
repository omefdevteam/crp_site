import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// The partner/funder logo circles on /programs are switched off by a code flag.
// Logo data and the admin editor stay; the page still reads the logos.

const file = "components/programs/ProgramSkillsPractice.tsx";
const src = fs.readFileSync(file, "utf8");

test("the public logos toggle exists and is off", () => {
  assert.match(src, /export const SHOW_PROGRAM_PARTNER_FUNDER_LOGOS = false;/);
});

test("partner and funder Circles are only rendered behind the toggle", () => {
  for (const group of ["programs.partners", "programs.funders"]) {
    const calls = src.split("\n").filter((l) => l.includes(`<Circles`) && l.includes(group));
    assert.equal(calls.length, 1, group);
    assert.match(calls[0], /SHOW_PROGRAM_PARTNER_FUNDER_LOGOS \?/);
    assert.match(calls[0], /: null,/);
  }
  assert.equal((src.match(/<Circles /g) ?? []).length, 2);
});

test("the comment says how to turn the logos back on", () => {
  assert.match(src, /set this back to true/i);
});

test("the page still reads logos, and the other practice visuals remain", () => {
  assert.match(fs.readFileSync("app/[lang]/programs/page.tsx", "utf8"), /publicSiteLogos\(\)/);
  for (const k of ['key="mic"', 'key="tree"', 'key="star"', 'key="recruit"']) assert.ok(src.includes(k), k);
});
