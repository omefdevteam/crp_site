import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import test, { after, before, describe } from "node:test";
import pg from "pg";
import { loader } from "./helpers.mjs";
import { startDatabase } from "./db.mjs";

// Partner and funder logos under Website text: file and field checks, who may
// change them, the built-in fallback (before the migration, with the DB down,
// and for a group nobody has edited), and the changes themselves.

const cacheCalls = [];
const pure = loader({
  "next/cache": { unstable_cache: (fn) => fn, updateTag: (tag) => cacheCalls.push(`tag:${tag}`), revalidatePath: (p, t) => cacheCalls.push(`path:${p}:${t}`) },
  "@/lib/db": { getDb: () => { throw new Error("no db in unit tests"); } },
});
const model = pure("lib/logos/model.ts");

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const WEBP = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 4, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50]);
const text = (value) => new TextEncoder().encode(value);
const SVG = text('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="g"/></defs><style>.a{fill:url(#g)}</style><rect class="a" width="10" height="10"/><use href="#g"/></svg>');

describe("logo file checks", () => {
  test("PNG, JPG, WebP and plain SVG files are accepted by their real contents", () => {
    for (const [bytes, type] of [[PNG, "image/png"], [JPG, "image/jpeg"], [WEBP, "image/webp"], [SVG, "image/svg+xml"]]) {
      const checked = model.checkLogoFile(bytes);
      assert.equal(checked.ok, true, type);
      assert.equal(checked.value.contentType, type);
    }
  });

  test("other files, empty files and files over 500 KB are refused", () => {
    assert.deepEqual(model.checkLogoFile(null), { ok: false, problem: "file-missing" });
    assert.deepEqual(model.checkLogoFile(new Uint8Array()), { ok: false, problem: "file-missing" });
    assert.deepEqual(model.checkLogoFile(text("GIF89a....")), { ok: false, problem: "file-type" });
    assert.deepEqual(model.checkLogoFile(text("%PDF-1.7")), { ok: false, problem: "file-type" });
    assert.deepEqual(model.checkLogoFile(text("<html><svg></svg></html>")), { ok: false, problem: "file-type" });
    const big = new Uint8Array(model.LOGO_BYTE_CAP + 1);
    big.set(PNG);
    assert.deepEqual(model.checkLogoFile(big), { ok: false, problem: "file-too-big" });
    const exact = new Uint8Array(model.LOGO_BYTE_CAP);
    exact.set(PNG);
    assert.equal(model.checkLogoFile(exact).ok, true);
  });

  test("SVGs with scripts, event handlers, outside links or embedded pages are refused", () => {
    const wrap = (inner) => text(`<svg xmlns="http://www.w3.org/2000/svg">${inner}</svg>`);
    const unsafe = [
      "<script>alert(1)</script>",
      '<rect onload="alert(1)"/>',
      '<rect ONCLICK = "x()"/>',
      "<foreignObject><div>hi</div></foreignObject>",
      '<a href="https://evil.example"><rect/></a>',
      '<use href="https://evil.example/sprite.svg#x"/>',
      '<image xlink:href="http://evil.example/x.png"/>',
      '<image href="javascript:alert(1)"/>',
      "<style>@import url(https://evil.example/x.css);</style>",
      '<rect style="fill:url(https://evil.example/x)"/>',
      '<set attributeName="href" to="javascript:alert(1)"/>',
      "<iframe src='x'></iframe>",
    ];
    for (const inner of unsafe) assert.deepEqual(model.checkLogoFile(wrap(inner)), { ok: false, problem: "file-unsafe" }, inner);
    assert.deepEqual(model.checkLogoFile(text('<!DOCTYPE svg [<!ENTITY x "y">]><svg>&x;</svg>')), { ok: false, problem: "file-unsafe" });
    assert.equal(model.checkLogoFile(wrap('<image href="data:image/png;base64,iVBORw0KGgo="/>')).ok, true, "embedded PNG is fine");
    assert.deepEqual(model.checkLogoFile(wrap('<image href="data:image/svg+xml;base64,PHN2Zz4="/>')), { ok: false, problem: "file-unsafe" });
  });

  test("names are required and tidied; links must be full https addresses", () => {
    assert.deepEqual(model.parseLogoName("  Climate \n Action  "), { ok: true, value: "Climate Action" });
    assert.deepEqual(model.parseLogoName("   "), { ok: false, problem: "name-missing" });
    assert.deepEqual(model.parseLogoName(null), { ok: false, problem: "name-missing" });
    assert.deepEqual(model.parseLogoName("x".repeat(121)), { ok: false, problem: "name-too-long" });
    assert.deepEqual(model.parseLogoLink(""), { ok: true, value: null });
    assert.deepEqual(model.parseLogoLink(" https://example.org/about "), { ok: true, value: "https://example.org/about" });
    for (const bad of ["http://example.org", "javascript:alert(1)", "example.org", "https://user:pw@example.org", "https://localhost", `https://example.org/${"x".repeat(500)}`]) {
      assert.deepEqual(model.parseLogoLink(bad), { ok: false, problem: "link-invalid" }, bad);
    }
  });

  test("every problem has a plain message without codes", () => {
    for (const [key, message] of Object.entries(model.LOGO_PROBLEM_TEXT)) {
      assert.ok(message.length > 10, key);
      assert.doesNotMatch(message, /[a-z]+-[a-z]+|_|\bnull\b|\bblob\b|\bDB\b|table/i, key);
    }
  });
});

describe("built-in fallback", () => {
  test("a group with no rows shows the built-in logos, matching the files on disk", () => {
    const shown = model.shownLogos([]);
    assert.deepEqual(shown, model.BUILTIN_LOGOS);
    assert.deepEqual(shown["programs.partners"].map((logo) => logo.src), [1, 2, 3].map((n) => `/images/programs/practice-partner-${n}.jpg`));
    assert.deepEqual(shown["programs.funders"].map((logo) => logo.fit), ["framed", "cover", "cover"]);
    for (const group of model.LOGO_GROUPS) for (const logo of group.builtins) assert.ok(fs.existsSync(`public${logo.src}`), logo.src);
  });

  test("rows replace the built-ins only for their own group, and broken rows are skipped", () => {
    const rows = [
      { id: "b", logoGroup: "programs.partners", position: 1, name: "Two", linkUrl: "https://two.example.org/", builtin: null, url: "https://abc.public.blob.vercel-storage.com/site-logos/programs-partners/x.png" },
      { id: "a", logoGroup: "programs.partners", position: 0, name: "One", linkUrl: "javascript:alert(1)", builtin: "partner-3", url: null },
      { id: "c", logoGroup: "programs.partners", position: 2, name: "Private", linkUrl: null, builtin: null, url: "https://abc.private.blob.vercel-storage.com/x.png" },
      { id: "d", logoGroup: "programs.partners", position: 3, name: "Gone", linkUrl: null, builtin: "partner-9", url: null },
    ];
    const shown = model.shownLogos(rows);
    assert.deepEqual(shown["programs.partners"].map((logo) => [logo.name, logo.fit, logo.link]), [["One", "cover", null], ["Two", "inside", "https://two.example.org/"]]);
    assert.equal(shown["programs.partners"][0].src, "/images/programs/practice-partner-3.jpg");
    assert.deepEqual(shown["programs.funders"], model.BUILTIN_LOGOS["programs.funders"]);
  });

  const read = () => pure("lib/logos/read.ts");
  const RETRY = { attemptTimeoutMs: 20, budgetMs: 200, retryDelayMs: 1, sleep: async () => {} };
  const quiet = { warn() {}, error() {} };
  const down = () => new Error("Connection terminated due to connection timeout");
  const ROW = { id: "r1", logoGroup: "programs.funders", position: 0, name: "Only funder", linkUrl: null, builtin: "funder-2", url: null };

  test("before the migration (no table yet) the public read is the built-in logos", async () => {
    const missing = Object.assign(new Error('relation "site_logos" does not exist'), { code: "42P01" });
    const db = { transaction: async () => { throw new Error("query failed", { cause: missing }); } };
    assert.deepEqual(await read().queryLogoRows(db), []);
    const other = { transaction: async () => { throw down(); } };
    await assert.rejects(read().queryLogoRows(other), /Connection terminated/);
  });

  test("regenerating a cached page with the DB down and no logos yet keeps the previous page", async () => {
    const { createLogoSource, LogosUnavailableError } = read();
    const source = createLogoSource({ query: async () => { throw down(); }, deadlineMs: 50, retry: RETRY, log: quiet });
    await assert.rejects(source.readForCachedPage("runtime"), (err) => err instanceof LogosUnavailableError);
  });

  test("with the DB down after a good read, cached pages keep the last good logos", async () => {
    const { createLogoSource } = read();
    let up = true;
    const source = createLogoSource({ query: async () => { if (!up) throw down(); return [ROW]; }, deadlineMs: 50, retry: RETRY, log: quiet });
    assert.equal((await source.readForCachedPage("runtime"))["programs.funders"][0].name, "Only funder");
    up = false;
    assert.equal((await source.readForCachedPage("runtime"))["programs.funders"][0].name, "Only funder");
    assert.equal((await source.read())["programs.funders"][0].name, "Only funder");
  });

  test("at build with the DB down, the built-in logos render with a short page lifetime", async () => {
    const { createLogoSource } = read();
    const lifetimes = [];
    const source = createLogoSource({ query: async () => { throw down(); }, deadlineMs: 50, retry: RETRY, log: quiet, shortenPageLifetime: () => lifetimes.push("short") });
    assert.equal(await source.readForCachedPage("build"), model.BUILTIN_LOGOS);
    assert.deepEqual(lifetimes, ["short"]);
    assert.equal(await source.readForCachedPage("dev"), model.BUILTIN_LOGOS, "next dev falls back quickly");
  });

  test("the programs page reads logos through the cached read, tagged with the copy tag", () => {
    const page = fs.readFileSync("app/[lang]/programs/page.tsx", "utf8");
    assert.match(page, /publicSiteLogos\(\)/);
    const source = fs.readFileSync("lib/logos/read.ts", "utf8");
    assert.match(source, /tags: \[COPY_TAG\]/);
    assert.doesNotMatch(source, /next\/headers|cookies\(|headers\(/);
  });
});

describe("permissions", () => {
  test("editors and admins may change logos; reviewers can't open Website text", () => {
    const { can } = pure("lib/staff/roles.ts");
    for (const role of ["admin", "editor"]) {
      assert.equal(can(role, "copy.edit"), true, role);
      assert.equal(can(role, "copy.publish"), true, role);
    }
    assert.equal(can("reviewer", "copy.edit"), false);
    assert.equal(can("reviewer", "copy.publish"), false);
    const actions = fs.readFileSync("app/admin/(console)/copy/logos/actions.ts", "utf8");
    assert.equal((actions.match(/await staffOrSignIn\(\)/g) ?? []).length, 5, "every action checks the role");
    assert.match(actions, /assertStaffAction\("copy\.publish"\)/);
    assert.match(fs.readFileSync("app/admin/(console)/copy/logos/page.tsx", "utf8"), /requireStaff\("copy\.edit"\)/);
  });

  test("logo uploads use their own public store token, never the private store's", () => {
    const manage = fs.readFileSync("lib/logos/manage.ts", "utf8");
    assert.match(manage, /LOGO_BLOB_READ_WRITE_TOKEN/);
    assert.doesNotMatch(manage, /env\.BLOB_READ_WRITE_TOKEN|access: "private"/);
    const { logoStoreFromEnv } = loader({ "next/cache": { unstable_cache: (fn) => fn, updateTag() {}, revalidatePath() {} } })("lib/logos/manage.ts");
    assert.equal(logoStoreFromEnv({ BLOB_READ_WRITE_TOKEN: "private-store" }), null);
  });
});

describe("changing logos", () => {
  let db;
  let sql;
  let load;
  let actor;
  const removed = [];
  const store = {
    async put(pathname) { return { url: `https://abc.public.blob.vercel-storage.com/${pathname}`, pathname }; },
    async remove(pathname) { removed.push(pathname); },
  };

  before(async () => {
    db = await startDatabase();
    process.env.DATABASE_URL = db.url;
    process.env.APP_SECRET = "test-secret-test-secret-test-secret-1234";
    process.env.NODE_ENV = "test";
    sql = new pg.Client({ connectionString: db.url });
    await sql.connect();
    load = loader({
      "next/cache": { unstable_cache: (fn) => fn, updateTag: (tag) => cacheCalls.push(`tag:${tag}`), revalidatePath: (p, t) => cacheCalls.push(`path:${p}:${t}`) },
    });
    actor = (await sql.query("insert into users (email, role) values ($1, 'editor') returning id", [`editor-${randomUUID()}@example.org`])).rows[0].id;
  });

  after(async () => {
    try { await load("lib/db/index.ts").closeDb(); } catch { /* ignore */ }
    try { await sql.end(); } catch { /* ignore */ }
    try { await db.stop(); } catch { /* ignore */ }
  });

  const manage = () => load("lib/logos/manage.ts");
  const getDb = () => load("lib/db/index.ts").getDb();
  const names = async (group) => (await sql.query("select name from site_logos where logo_group = $1 order by position", [group])).rows.map((row) => row.name);
  const events = async () => (await sql.query("select kind, detail from admin_events where kind like 'logo.%' order by created_at, id")).rows;

  test("an untouched group shows the built-ins; the first change copies them in and clears the cached pages", async () => {
    const desk = await manage().loadLogoDesk(getDb(), store);
    assert.equal(desk.ready, true);
    assert.equal(desk.groups[0].builtIn, true);
    assert.equal(desk.groups[0].logos[1].ref, "builtin:partner-2");
    cacheCalls.length = 0;
    const moved = await manage().moveLogo(getDb(), actor, { group: "programs.partners", ref: "builtin:partner-2", direction: "up" });
    assert.deepEqual(moved, { ok: true });
    assert.deepEqual(await names("programs.partners"), ["Climate Action Network South Africa", "Africa Climate Mobility Initiative", "Climate Communications and Local Governance – Africa"]);
    assert.deepEqual(cacheCalls, ["tag:copy", "path:/[lang]:layout"]);
    assert.deepEqual(await names("programs.funders"), [], "the other group is untouched");
  });

  test("add, rename, replace, remove: each is recorded in plain English", async () => {
    const m = manage();
    assert.deepEqual(await m.addLogo(getDb(), store, actor, { group: "programs.funders", name: "Green Fund", link: "https://green.example.org", file: PNG }), { ok: true });
    assert.deepEqual(await names("programs.funders"), ["Sony", "Adobe", "Figma", "Green Fund"]);
    assert.deepEqual(await m.addLogo(getDb(), store, actor, { group: "programs.funders", name: "Fifth", link: "", file: PNG }), { ok: false, reason: "full" });
    assert.equal(removed.length, 1, "the refused upload's file is cleaned up");
    const [green] = (await sql.query("select id, pathname from site_logos where name = 'Green Fund'")).rows;
    assert.deepEqual(await m.updateLogo(getDb(), actor, { group: "programs.funders", ref: green.id, name: "Green Climate Fund", link: "" }), { ok: true });
    assert.deepEqual(await m.replaceLogo(getDb(), store, actor, { group: "programs.funders", ref: green.id, file: SVG }), { ok: true });
    assert.ok(removed.includes(green.pathname), "the old file is deleted after a replace");
    const [sony] = (await sql.query("select id from site_logos where builtin = 'funder-1'")).rows;
    assert.deepEqual(await m.removeLogo(getDb(), store, actor, { group: "programs.funders", ref: sony.id }), { ok: true });
    assert.deepEqual(await names("programs.funders"), ["Adobe", "Figma", "Green Climate Fund"]);
    const positions = (await sql.query("select position from site_logos where logo_group = 'programs.funders' order by position")).rows.map((row) => row.position);
    assert.deepEqual(positions, [0, 1, 2]);

    const { activityLabel } = load("lib/admin/activity.ts");
    const labels = (await events()).map((row) => activityLabel(row.kind, row.detail));
    assert.deepEqual(labels, [
      "Moved the “Climate Action Network South Africa” logo earlier (Partner logos)",
      "Added the “Green Fund” logo (Funder logos)",
      "Renamed the “Green Fund” logo to “Green Climate Fund” (Funder logos)",
      "Replaced the image for the “Green Climate Fund” logo (Funder logos)",
      "Removed the “Sony” logo (Funder logos)",
    ]);
  });

  test("bad input and stale references change nothing", async () => {
    const m = manage();
    const before = await events();
    assert.deepEqual(await m.addLogo(getDb(), store, actor, { group: "programs.partners", name: "", link: "", file: PNG }), { ok: false, reason: "name-missing" });
    assert.deepEqual(await m.addLogo(getDb(), store, actor, { group: "programs.partners", name: "X", link: "ftp://x", file: PNG }), { ok: false, reason: "link-invalid" });
    assert.deepEqual(await m.addLogo(getDb(), store, actor, { group: "programs.partners", name: "X", link: "", file: text("<svg><script/></svg>") }), { ok: false, reason: "file-unsafe" });
    assert.deepEqual(await m.addLogo(getDb(), null, actor, { group: "programs.partners", name: "X", link: "", file: PNG }), { ok: false, reason: "storage-off" });
    assert.deepEqual(await m.updateLogo(getDb(), actor, { group: "programs.partners", ref: randomUUID(), name: "X", link: "" }), { ok: false, reason: "not-found" });
    assert.deepEqual(await m.moveLogo(getDb(), actor, { group: "programs.nowhere", ref: "builtin:partner-1", direction: "up" }), { ok: false, reason: "not-found" });
    const [other] = (await sql.query("select id from site_logos where logo_group = 'programs.funders' limit 1")).rows;
    assert.deepEqual(await m.removeLogo(getDb(), store, actor, { group: "programs.partners", ref: other.id }), { ok: false, reason: "not-found" }, "a logo from another group");
    assert.equal((await events()).length, before.length);
  });

  test("the last logo in a group can't be removed", async () => {
    const m = manage();
    const ids = (await sql.query("select id from site_logos where logo_group = 'programs.partners' order by position")).rows.map((row) => row.id);
    assert.deepEqual(await m.removeLogo(getDb(), store, actor, { group: "programs.partners", ref: ids[0] }), { ok: true });
    assert.deepEqual(await m.removeLogo(getDb(), store, actor, { group: "programs.partners", ref: ids[1] }), { ok: true });
    assert.deepEqual(await m.removeLogo(getDb(), store, actor, { group: "programs.partners", ref: ids[2] }), { ok: false, reason: "last-logo" });
  });

  test("the public read and the dashboard both see the stored logos", async () => {
    const { queryLogoRows } = load("lib/logos/read.ts");
    const { shownLogos } = load("lib/logos/model.ts");
    const shown = shownLogos(await queryLogoRows(getDb()));
    assert.deepEqual(shown["programs.funders"].map((logo) => logo.name), ["Adobe", "Figma", "Green Climate Fund"]);
    assert.equal(shown["programs.funders"][2].fit, "inside");
    assert.match(shown["programs.funders"][2].src, /^https:\/\/abc\.public\.blob\.vercel-storage\.com\/site-logos\/programs-funders\/.+\.svg$/);
  });

  test("without the table (migration not applied yet) the dashboard and site fall back to the built-ins", async () => {
    await sql.query("alter table site_logos rename to site_logos_parked");
    try {
      const desk = await manage().loadLogoDesk(getDb(), store);
      assert.equal(desk.ready, false);
      assert.ok(desk.groups.every((group) => group.builtIn));
      assert.deepEqual(await manage().moveLogo(getDb(), actor, { group: "programs.partners", ref: "builtin:partner-1", direction: "down" }), { ok: false, reason: "not-ready" });
      const { queryLogoRows } = load("lib/logos/read.ts");
      assert.deepEqual(await queryLogoRows(getDb()), []);
    } finally {
      await sql.query("alter table site_logos_parked rename to site_logos");
    }
  });
});
