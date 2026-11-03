import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loader } from "./helpers.mjs";

// Page-HTML caching: the public /[lang]/* pages are prerendered and their HTML
// is cached for up to 10 minutes. These tests pin the two things that make
// that safe: a DB failure is never cached as the default text, and nothing on
// a public page reads per-visitor request data while rendering.

function setup() {
  const load = loader({
    "next/cache": { unstable_cache: (fn) => fn, updateTag: () => {}, revalidatePath: () => {} },
    "@/lib/db": { getDb: () => { throw new Error("no db in unit tests"); } },
  });
  return { read: load("lib/copy/read.ts"), catalog: load("lib/copy/catalog.ts") };
}

const ROWS = [{ catalog: "page", locale: "en", key: "hero.line1Accent", value: "unequally" }];
const RETRY = { attemptTimeoutMs: 20, budgetMs: 200, retryDelayMs: 1, sleep: async () => {} };
const quiet = { warn() {}, error() {} };

function down() {
  return new Error("Connection terminated due to connection timeout");
}

// A source whose cache wrapper records every value it would store.
function source(read, { query, ...rest }) {
  const stored = [];
  const lifetimes = [];
  const copy = read.createCopySource({
    query,
    cache: (refresh) => async () => {
      const value = await refresh();
      stored.push(value);
      return value;
    },
    deadlineMs: 1000,
    retry: RETRY,
    log: quiet,
    shortenPageLifetime: () => lifetimes.push("shortened"),
    ...rest,
  });
  return { copy, stored, lifetimes };
}

test("regenerating a cached page with the DB down and no copy yet throws, so the previous page is kept", async () => {
  const { read } = setup();
  const { copy, stored, lifetimes } = source(read, { query: async () => { throw down(); } });
  await assert.rejects(copy.readForCachedPage("runtime"), (err) => err instanceof read.CopyUnavailableError);
  assert.deepEqual(stored, [], "the copy cache never stores anything for a failed read");
  assert.deepEqual(lifetimes, []);
});

test("a DB that hangs while a cached page regenerates also throws rather than rendering the defaults", async () => {
  const { read } = setup();
  const { copy, stored } = source(read, { query: () => new Promise(() => {}), cachedReadLimitMs: 100 });
  await assert.rejects(copy.readForCachedPage("runtime"), (err) => err instanceof read.CopyUnavailableError);
  assert.deepEqual(stored, []);
});

test("a cached page waits out a slow DB instead of falling back after 1.5s", async () => {
  const { read, catalog } = setup();
  const { copy } = source(read, {
    query: () => new Promise((resolve) => setTimeout(() => resolve(ROWS), 60)),
    deadlineMs: 5,
    retry: { ...RETRY, attemptTimeoutMs: 500, budgetMs: 1000 },
  });
  const published = await copy.readForCachedPage("runtime");
  assert.equal(catalog.mergePage(published, "en").hero.line1Accent, "unequally");
});

test("with the DB down after a good read, a cached page shows the last good copy, never the defaults", async () => {
  const { read, catalog } = setup();
  let up = true;
  const { copy, stored } = source(read, { query: async () => { if (up) return ROWS; throw down(); } });
  await copy.readForCachedPage("runtime");
  up = false;
  const published = await copy.readForCachedPage("runtime");
  assert.equal(catalog.mergePage(published, "en").hero.line1Accent, "unequally");
  assert.notEqual(published, catalog.NO_OVERRIDES);
  // Re-caching the real last good rows is fine; the defaults never are.
  assert.deepEqual(stored, [ROWS, ROWS]);
});

test("a non-connection error with a last good copy still serves that copy on a cached page", async () => {
  const { read, catalog } = setup();
  let fail = false;
  const { copy } = source(read, { query: async () => { if (fail) throw new Error('relation "copy_revisions" does not exist'); return ROWS; } });
  await copy.readForCachedPage("runtime");
  fail = true;
  const published = await copy.readForCachedPage("runtime");
  assert.equal(catalog.mergePage(published, "en").hero.line1Accent, "unequally");
});

test("at build, a DB failure prerenders the defaults but shortens that page's cache lifetime", async () => {
  const { read, catalog } = setup();
  const { copy, stored, lifetimes } = source(read, { query: async () => { throw down(); } });
  assert.equal(await copy.readForCachedPage("build"), catalog.NO_OVERRIDES);
  assert.deepEqual(lifetimes, ["shortened"]);
  assert.deepEqual(stored, []);
});

test("at build, a good read keeps the normal 10-minute lifetime", async () => {
  const { read, catalog } = setup();
  const { copy, lifetimes } = source(read, { query: async () => ROWS });
  const published = await copy.readForCachedPage("build");
  assert.equal(catalog.mergePage(published, "en").hero.line1Accent, "unequally");
  assert.deepEqual(lifetimes, []);
});

test("in next dev nothing is cached, so the usual quick fallback applies", async () => {
  const { read, catalog } = setup();
  const { copy, lifetimes } = source(read, { query: async () => { throw down(); } });
  assert.equal(await copy.readForCachedPage("dev"), catalog.NO_OVERRIDES);
  assert.deepEqual(lifetimes, []);
});

test("the render phase comes from next build / NODE_ENV", () => {
  const { read } = setup();
  assert.equal(read.cachedRenderPhase({ NEXT_PHASE: "phase-production-build", NODE_ENV: "production" }), "build");
  assert.equal(read.cachedRenderPhase({ NODE_ENV: "production" }), "runtime");
  assert.equal(read.cachedRenderPhase({ NODE_ENV: "development" }), "dev");
  assert.equal(read.cachedRenderPhase({ NODE_ENV: "test" }), "dev");
});

test("the public layout and SEO helpers use the cached-page copy read", () => {
  for (const file of ["app/[lang]/layout.tsx", "lib/seo.ts", "components/StructuredData.tsx", "app/[lang]/partner/reach-out/page.tsx"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /publicSiteCopy/, file);
    assert.doesNotMatch(source, /\bsiteCopy\(/, file);
  }
});

// ---- No per-visitor request data on public pages ----

const ROOT = path.resolve(".");
const FORBIDDEN = [
  [/from\s+["']next\/headers["']/, "next/headers (cookies/headers)"],
  [/from\s+["']next\/root-params["']/, "next/root-params"],
  [/["']@\/lib\/request-locale["']/, "request-locale (reads headers)"],
  [/["']@\/lib\/staff\/(gate|session)["']/, "the staff session"],
  [/\bunstable_noStore\b|\bnoStore\(/, "noStore"],
  [/\bconnection\(\)/, "connection()"],
  [/export\s+const\s+dynamic\s*=/, "a route segment `dynamic` override"],
  [/\bdraftMode\(/, "draftMode"],
];

function resolveImport(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function publicRenderFiles() {
  const entries = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) entries.push(full);
    }
  })(path.join(ROOT, "app/[lang]"));
  const seen = new Set();
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !/\.(tsx?|jsx?)$/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    // Server actions only run when a visitor submits a form, never while rendering.
    if (/^\s*["']use server["']/.test(source)) continue;
    seen.add(file);
    for (const [, spec] of source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const resolved = resolveImport(file, spec);
      if (resolved) queue.push(resolved);
    }
  }
  return { entries, all: [...seen] };
}

test("no public page reads cookies, headers or the session while rendering", () => {
  const { entries, all } = publicRenderFiles();
  assert.ok(all.length > 50, `walked ${all.length} files`);
  for (const must of ["lib/seo.ts", "components/StructuredData.tsx", "components/LanguageProvider.tsx", "components/programs/ProgramApplyBar.tsx", "lib/copy/read.ts"]) {
    assert.ok(all.includes(path.join(ROOT, must)), `${must} is part of the public render`);
  }
  const problems = [];
  for (const file of all) {
    const source = fs.readFileSync(file, "utf8");
    for (const [pattern, what] of FORBIDDEN) if (pattern.test(source)) problems.push(`${path.relative(ROOT, file)} uses ${what}`);
  }
  for (const file of entries) {
    if (/searchParams/.test(fs.readFileSync(file, "utf8"))) problems.push(`${path.relative(ROOT, file)} reads searchParams on the server`);
  }
  assert.deepEqual(problems, []);
});

test("the public pages are prerendered for every locale with a 10-minute revalidate", () => {
  const layout = fs.readFileSync("app/[lang]/layout.tsx", "utf8");
  assert.match(layout, /export const revalidate = 600;/);
  assert.match(layout, /export const dynamicParams = false;/);
  assert.match(layout, /generateStaticParams/);
});

test("the programs bar never names a mode before it knows ?intent=", () => {
  const bar = fs.readFileSync("components/programs/ProgramApplyBar.tsx", "utf8");
  const placeholder = bar.slice(bar.indexOf("function ProgramApplyBarPlaceholder"), bar.indexOf("/** Floating CTA"));
  assert.match(bar, /<Suspense fallback=\{<ProgramApplyBarPlaceholder \/>\}>/);
  assert.doesNotMatch(placeholder, /"Apply"|"Nominate"/);
  assert.match(placeholder, /disabled/);
});
