import test from "node:test";
import assert from "node:assert/strict";
import { loader } from "./helpers.mjs";

const { supportsCssScale, CSS_SCALE_FEATURES } = loader()("lib/cssScale.ts");

test("CSS scale path needs trig and container units", () => {
  assert.equal(supportsCssScale({ supports: () => true }), true);
  for (const missing of CSS_SCALE_FEATURES) {
    assert.equal(supportsCssScale({ supports: (q) => q !== missing }), false, missing);
  }
});

test("CSS scale falls back when CSS.supports is missing or throws", () => {
  assert.equal(supportsCssScale(null), false);
  assert.equal(supportsCssScale({}), false);
  assert.equal(supportsCssScale({ supports: () => { throw new Error("x"); } }), false);
});
