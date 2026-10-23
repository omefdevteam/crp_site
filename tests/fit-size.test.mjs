import assert from "node:assert/strict";
import test from "node:test";
import { loader } from "./helpers.mjs";

const load = loader();
const { widestRun, fitVars } = load("lib/fitSize.ts");
const { FIT_CHARS, FIT_ADVANCES } = load("lib/fitMetrics.ts");

test("fit metrics cover every character for both fonts", () => {
  const count = [...FIT_CHARS].length;
  assert.equal(FIT_ADVANCES.trail.length, count);
  assert.equal(FIT_ADVANCES.outfit.length, count);
});

test("widestRun picks the widest unbreakable run, splitting after hyphens", () => {
  const run = widestRun("Contactez-nous", "trail", { upper: true });
  assert.equal(run.n, "CONTACTEZ-".length);
  const nowrap = widestRun("Contactez-nous", "trail", { upper: true, nowrap: true });
  assert.equal(nowrap.n, "CONTACTEZ-NOUS".length);
  assert.ok(nowrap.em > run.em);
});

test("widestRun applies trail capital kerning", () => {
  const kerned = widestRun("AV", "trail", { upper: true }).em;
  const apart = widestRun("A", "trail").em + widestRun("V", "trail").em;
  assert.ok(kerned < apart);
});

test("a row of headings shares the widest run", () => {
  const row = ["Devenir ambassadeur", "Partager un récit", "Intervenir"];
  const widest = Math.max(...row.map((t) => widestRun(t, "outfit").em));
  assert.equal(widestRun(row, "outfit").em, widest);
});

test("fitVars never divides by zero", () => {
  assert.equal(fitVars("", "trail")["--fit-em"], "0.0010");
  assert.equal(fitVars("", "trail")["--fit-n"], 0);
});
