import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const src = fs.readFileSync("components/ambassadorship/AmbassadorshipLanding.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

test("mobile program row breaks out on both sides and desktop resets it", () => {
  const row = src.match(/className="(no-scrollbar[^"]*)"/)?.[1] ?? "";
  for (const c of ["-mx-12", "px-12", "overflow-x-auto", "desk:mx-0", "desk:px-0", "desk:overflow-visible"]) {
    assert.ok(row.split(" ").includes(c), `missing ${c}`);
  }
  assert.ok(!/(^| )-mr-12( |$)/.test(row), "one-sided breakout left behind");
});

test("PR #169 changes are not reintroduced", () => {
  assert.ok(!/\.apply-frame-content\s*\{[^}]*padding-bottom/.test(css));
});
