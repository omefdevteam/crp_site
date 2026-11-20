import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const tsx = readFileSync("components/ambassadorship/AmbassadorshipLanding.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

test("program cards can grow with localized text on phones", () => {
  assert.doesNotMatch(tsx, /relative flex size-\[147px\]/);
  assert.match(tsx, /min-h-\[147px\] w-\[147px\]/);
  assert.match(tsx, /desk:min-h-0/);
});

test("apply content reserves room for the sticky frame's corners on phones only", () => {
  const base = css.match(/\.apply-frame-content \{\n  --apply-frame-r[^}]*\}/)[0];
  assert.match(base, /padding-bottom: calc\(var\(--apply-frame-r\)/);
  const desk = css.slice(css.indexOf("@media (min-width: 900px)", css.indexOf(".apply-frame-corner--right")));
  assert.match(desk, /\.apply-frame-content \{\s*padding-bottom: 0;/);
});
