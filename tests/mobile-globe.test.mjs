import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// The home Platform globe must stay live (spinning, pins, sideways drag) on phones;
// About's hero globe keeps its static image there.
test("home Platform globe opts into the live globe on phones", () => {
  const section = fs.readFileSync("components/PlatformSection.tsx", "utf8");
  const call = section.slice(section.indexOf("<PlatformGlobe"), section.indexOf("/>", section.indexOf("<PlatformGlobe")));
  assert.match(call, /\bliveOnMobile\b/);
});

test("About's globe does not opt into the live globe on phones", () => {
  const about = fs.readFileSync("components/about/AboutPage.tsx", "utf8");
  assert.doesNotMatch(about, /liveOnMobile/);
});

test("PlatformGlobe only skips the live globe on phones without liveOnMobile", () => {
  const src = fs.readFileSync("components/platform/PlatformGlobe.tsx", "utf8");
  assert.match(src, /liveOnMobile = false/);
  assert.match(src, /near && \(liveOnMobile \|\| !isMobile\)/);
});

test("touch drag on the live globe is sideways only so the page still scrolls", () => {
  const src = fs.readFileSync("components/platform/Globe.tsx", "utf8");
  assert.match(src, /touchAction: "pan-y"/);
  assert.match(src, /pointerType === "touch"/);
});
