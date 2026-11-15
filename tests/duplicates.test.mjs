import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import pg from "pg";
import { loader } from "./helpers.mjs";
import { startDatabase } from "./db.mjs";

let db;
let sql;
let load;

before(async () => {
  db = await startDatabase();
  process.env.DATABASE_URL = db.url;
  process.env.APP_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.NODE_ENV = "test";
  process.env.ADMIN_EMAILS = "admin@example.org";
  sql = new pg.Client({ connectionString: db.url });
  await sql.connect();
  load = loader({
    "next/cache": { unstable_cache: (fn) => fn, updateTag() {}, revalidatePath() {}, revalidateTag() {} },
    "next/headers": { headers: async () => new Headers(), cookies: async () => ({ get: () => undefined, set() {}, delete() {} }) },
    "next/navigation": { redirect: (url) => { throw new Error(`redirect ${url}`); }, notFound: () => { throw new Error("not found"); } },
  });
});

after(async () => {
  try { await load("lib/db/index.ts").closeDb(); } catch { /* already closed */ }
  try { await sql.end(); } catch { /* ignore */ }
  try { await db.stop(); } catch { /* ignore */ }
});

const mod = (path) => load(path);
const getDb = () => mod("lib/db/index.ts").getDb();

// ---- Pure rules ----

const day = (n, hour = 9, minute = 0) => new Date(Date.UTC(2026, 9, n, hour, minute));
const app = (id, extra) => ({ id, createdAt: day(1), email: null, phone: null, name: "Ada Lovelace", dob: "2001-02-03", scope: "in_person", ...extra });

test("emails and phones are compared the way people actually type them", () => {
  const { normalizeEmail, normalizePhone } = mod("lib/duplicates/match.ts");
  assert.equal(normalizeEmail(" Ada.L+apply@GMAIL.com "), "adal@gmail.com");
  assert.equal(normalizeEmail("adal@googlemail.com"), "adal@gmail.com");
  assert.equal(normalizeEmail("ada.l+x@example.org"), "ada.l@example.org");
  assert.equal(normalizeEmail("not-an-email"), null);
  assert.equal(normalizeEmail("@example.org"), null);
  assert.equal(normalizePhone("+254 712 345 678"), normalizePhone("0712345678"));
  assert.equal(normalizePhone("12345"), null);
  assert.equal(normalizePhone(null), null);
});

test("the same person applying twice for the same track is one repeat", () => {
  const { findPairs } = mod("lib/duplicates/match.ts");
  const pairs = findPairs("applicants", [
    app("a", { email: "ada@example.org", createdAt: day(1) }),
    app("b", { email: "ada.lovelace@other.org", createdAt: day(5) }),
  ]);
  assert.deepEqual(pairs, [{ recordId: "b", originalId: "a", reasons: ["same_name_and_birth_date", "same_track"], automatic: false }]);
});

test("the same person applying for something else is not a repeat", () => {
  const { findPairs } = mod("lib/duplicates/match.ts");
  // Same phone and same name + birth date, but a different programme track.
  assert.deepEqual(findPairs("applicants", [
    app("a", { phone: "+254 712345678", scope: "in_person" }),
    app("b", { phone: "0712345678", scope: "online", createdAt: day(2) }),
  ]), []);
});

test("a shared name or first name alone never makes a repeat", () => {
  const { findPairs } = mod("lib/duplicates/match.ts");
  assert.deepEqual(findPairs("applicants", [
    app("a", { email: "one@example.org", dob: "2001-02-03" }),
    app("b", { email: "two@example.org", dob: "1999-12-31", createdAt: day(2) }),
  ]), [], "same name, different birth date");
  assert.deepEqual(findPairs("applicants", [
    app("a", { name: "Ada", email: "one@example.org" }),
    app("b", { name: "Ada", email: "two@example.org", createdAt: day(2) }),
  ]), [], "a single first name and a birth date is too common");
});

test("messages repeat only with the same sender and the same text, within two weeks", () => {
  const { findPairs } = mod("lib/duplicates/match.ts");
  const msg = (id, extra) => ({ id, createdAt: day(1), email: "sam@example.org", phone: "+44 7700900123", name: "Sam", scope: "message", body: "Hello, I would like to know when the next programme opens in Lagos please.", ...extra });

  const doubleClick = findPairs("messages", [msg("a"), msg("b", { createdAt: day(1, 9, 3) })]);
  assert.deepEqual(doubleClick, [{ recordId: "b", originalId: "a", reasons: ["same_email", "same_phone", "same_text"], automatic: true }]);

  const resent = findPairs("messages", [msg("a"), msg("b", { createdAt: day(4), body: "Hello, I would like to know when the next programme opens in Lagos." })]);
  assert.equal(resent.length, 1);
  assert.equal(resent[0].automatic, false);
  assert.ok(resent[0].reasons.includes("similar_text"));

  assert.deepEqual(findPairs("messages", [msg("a"), msg("b", { createdAt: day(4), body: "Can I volunteer as a translator at the pavilion?" })]), [], "a new question");
  assert.deepEqual(findPairs("messages", [msg("a"), msg("b", { createdAt: day(20) })]), [], "too long after");
  assert.deepEqual(findPairs("messages", [msg("a", { body: "Hi" }), msg("b", { body: "Hello", createdAt: day(2) })]), [], "short texts must match exactly");
  assert.deepEqual(findPairs("messages", [msg("a"), msg("b", { email: "other@example.org", phone: "+44 7700900999", createdAt: day(1, 9, 2) })]), [], "another sender");
});

test("partner inquiries repeat for the same organisation and kind of support", () => {
  const { findPairs } = mod("lib/duplicates/match.ts");
  const ask = (id, extra) => ({ id, createdAt: day(1), email: "kofi@ngo.org", phone: null, name: "Kofi", scope: "green earth|funding", body: null, ...extra });
  assert.equal(findPairs("partners", [ask("a"), ask("b", { createdAt: day(3) })]).length, 1);
  assert.deepEqual(findPairs("partners", [ask("a"), ask("b", { scope: "green earth|venue", createdAt: day(3) })]), [], "a different kind of support");
});

test("pairs come out the same whatever order the entries arrive in", () => {
  const { findPairs } = mod("lib/duplicates/match.ts");
  const entries = [
    app("c", { email: "ada@example.org", createdAt: day(9) }),
    app("a", { email: "ada@example.org", createdAt: day(1) }),
    app("b", { email: "ADA@example.org", createdAt: day(5) }),
  ];
  const forward = findPairs("applicants", entries);
  const backward = findPairs("applicants", [...entries].reverse());
  assert.deepEqual(forward, backward);
  assert.deepEqual(forward.map((p) => `${p.recordId}>${p.originalId}`), ["b>a", "c>b", "c>a"]);
});

// ---- Against the database ----

let seq = 0;
async function insertApplicant(extra = {}) {
  seq += 1;
  const { rows } = await sql.query(
    `insert into applicants (full_name, email, dob, age, track, phone, created_at)
     values ($1, $2, $3, 25, $4, $5, $6) returning id`,
    [extra.name ?? `Person ${seq} Test`, extra.email ?? `p${seq}@example.org`, extra.dob ?? "2000-01-01", extra.track ?? "in_person", extra.phone ?? null, extra.at ?? new Date()],
  );
  return rows[0].id;
}

async function insertMessage(extra = {}) {
  const { rows } = await sql.query(
    `insert into contact_messages (name, email, phone, body, locale, created_at) values ($1, $2, $3, $4, 'en', $5) returning id`,
    [extra.name ?? "Sam Doe", extra.email ?? "sam@example.org", extra.phone ?? "+44 7700900123", extra.body ?? "When does the next programme open in Lagos please?", extra.at ?? new Date()],
  );
  return rows[0].id;
}

async function staffUser(role) {
  seq += 1;
  const email = `${role}-${seq}@example.org`;
  const { rows } = await sql.query("insert into users (email, role) values ($1, $2) returning id", [email, role]);
  return { id: rows[0].id, email, role, name: null };
}

const minutesAgo = (n) => new Date(Date.now() - n * 60_000);

test("a scan stores suggestions once, and a rescan never undoes a decision", async () => {
  const { scanList, matchCount } = mod("lib/duplicates/scan.ts");
  const { decideMatch, matchesFor } = mod("lib/duplicates/review.ts");
  const first = await insertApplicant({ name: "Grace Hopper", dob: "1999-12-09", email: "grace@example.org", at: minutesAgo(600) });
  const second = await insertApplicant({ name: "Grace  Hopper", dob: "1999-12-09", email: "g.hopper@uni.edu", at: minutesAgo(300) });
  const online = await insertApplicant({ name: "Grace Hopper", dob: "1999-12-09", email: "gh@mail.org", track: "online", at: minutesAgo(100) });

  const scanned = await scanList(getDb(), "applicants");
  assert.equal(scanned.added, 1);
  const matches = await matchesFor(getDb(), "applicants", second);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].other.id, first);
  assert.equal(matches[0].side, "earlier");
  assert.equal(matches[0].status, "suggested");
  assert.deepEqual(await matchesFor(getDb(), "applicants", online), [], "a different track is not a repeat");

  const reviewer = await staffUser("reviewer");
  assert.deepEqual(await decideMatch(getDb(), reviewer, { matchId: matches[0].id, verb: "dismiss", expected: "suggested" }), { ok: true, status: "dismissed" });
  const before = await matchCount(getDb());
  assert.equal((await scanList(getDb(), "applicants")).added, 0);
  assert.equal(await matchCount(getDb()), before);
  assert.equal((await matchesFor(getDb(), "applicants", second))[0].status, "dismissed");
});

test("deciding needs the right role and the status the reviewer saw", async () => {
  const { scanList } = mod("lib/duplicates/scan.ts");
  const { decideMatch, matchesFor, canDecide } = mod("lib/duplicates/review.ts");
  await insertApplicant({ name: "Alan Turing", dob: "1998-06-23", phone: "+44 7911 123456", email: "alan@example.org", at: minutesAgo(500) });
  const repeat = await insertApplicant({ name: "A Turing", dob: "1998-06-23", phone: "07911123456", email: "turing@example.org", at: minutesAgo(400) });
  await scanList(getDb(), "applicants");
  const [match] = await matchesFor(getDb(), "applicants", repeat);
  assert.deepEqual(match.reasons, ["same phone number", "same programme track"]);

  assert.equal(canDecide("editor", "applicants"), false);
  assert.equal(canDecide("reviewer", "applicants"), true);
  assert.equal(canDecide("reviewer", "messages"), false);
  assert.equal(canDecide("admin", "messages"), true);

  const editor = await staffUser("editor");
  assert.deepEqual(await decideMatch(getDb(), editor, { matchId: match.id, verb: "confirm", expected: "suggested" }), { ok: false, reason: "forbidden" });
  const reviewer = await staffUser("reviewer");
  assert.deepEqual(await decideMatch(getDb(), reviewer, { matchId: match.id, verb: "confirm", expected: "suggested" }), { ok: true, status: "confirmed" });
  assert.deepEqual(await decideMatch(getDb(), reviewer, { matchId: match.id, verb: "dismiss", expected: "suggested" }), { ok: false, reason: "stale" });
  assert.deepEqual(await decideMatch(getDb(), reviewer, { matchId: "nope", verb: "dismiss", expected: "suggested" }), { ok: false, reason: "not_found" });

  const { rows } = await sql.query("select kind, detail from admin_events where actor_id = $1", [reviewer.id]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].kind, "duplicate.decided");
  const { activityLabel } = mod("lib/admin/activity.ts");
  assert.equal(activityLabel("duplicate.decided", { list: "applicants", to: "confirmed" }), "Marked an application as a repeat");

  assert.deepEqual(await decideMatch(getDb(), reviewer, { matchId: match.id, verb: "reopen", expected: "confirmed" }), { ok: true, status: "suggested" });
  const { rows: after } = await sql.query("select decided_at, decided_by from duplicate_matches where id = $1", [match.id]);
  assert.equal(after[0].decided_at, null);
});

test("lists label repeats, count them and can show one row per person", async () => {
  await sql.query("delete from duplicate_matches where list = 'applicants'");
  await sql.query("delete from applicants");
  const { scanList } = mod("lib/duplicates/scan.ts");
  const { decideMatch, matchesFor } = mod("lib/duplicates/review.ts");
  const { loadRecords, parseRecordQuery } = mod("lib/admin/records.ts");
  const original = await insertApplicant({ name: "Mae Jemison", dob: "2002-10-17", email: "mae@example.org", at: minutesAgo(900) });
  const repeat = await insertApplicant({ name: "Mae Jemison", dob: "2002-10-17", email: "mae.j@example.org", at: minutesAgo(800) });
  const maybe = await insertApplicant({ name: "Mae Jemison", dob: "2002-10-17", email: "jemison@example.org", at: minutesAgo(700) });
  await insertApplicant({ name: "Someone Else", email: "else@example.org", at: minutesAgo(600) });
  await scanList(getDb(), "applicants");
  const admin = await staffUser("admin");
  const pair = (await matchesFor(getDb(), "applicants", repeat)).find((m) => m.other.id === original);
  await decideMatch(getDb(), admin, { matchId: pair.id, verb: "confirm", expected: "suggested" });

  const viewer = { id: admin.id, role: "admin" };
  const all = await loadRecords(getDb(), parseRecordQuery({ list: "applicants" }), viewer);
  assert.equal(all.total, 4);
  assert.deepEqual(all.repeats, { repeats: 1, suggested: 1 });
  const flag = (id) => all.rows.find((row) => row.id === id).repeat;
  assert.equal(flag(repeat), "confirmed");
  assert.equal(flag(maybe), "suggested");
  assert.equal(flag(original), undefined);

  const people = await loadRecords(getDb(), parseRecordQuery({ list: "applicants", repeats: "hide" }), viewer);
  assert.equal(people.total, 3);
  assert.ok(!people.rows.some((row) => row.id === repeat));
  const open = await loadRecords(getDb(), parseRecordQuery({ list: "applicants", repeats: "open" }), viewer);
  assert.deepEqual(open.rows.map((row) => row.id), [maybe]);
  const only = await loadRecords(getDb(), parseRecordQuery({ list: "applicants", repeats: "only" }), viewer);
  assert.deepEqual(only.rows.map((row) => row.id), [repeat]);
  assert.equal(parseRecordQuery({ list: "applicants", repeats: "drop table" }).repeats, "");

  const { exportList } = mod("lib/admin/records.ts");
  const sheet = await exportList(getDb(), admin, parseRecordQuery({ list: "applicants" }));
  const lines = sheet.body.replace(/^﻿/, "").trim().split(/\r?\n/);
  assert.match(lines[0], /,repeat$/);
  assert.ok(lines.some((line) => line.includes("mae.j@example.org") && line.endsWith(",confirmed")));
  const { rows: events } = await sql.query("select detail from admin_events where kind = 'records.exported' and actor_id = $1", [admin.id]);
  assert.equal(events.length, 1);

  const { loadDashboard } = mod("lib/admin/dashboard.ts");
  const dashboard = await loadDashboard(getDb(), "admin");
  assert.deepEqual(dashboard.repeats.applicants, { repeats: 1, suggested: 1 });
  const { attentionItems } = mod("components/admin/DashboardView.tsx");
  assert.ok(attentionItems(dashboard).some((item) => item.href === "/admin/records?list=applicants&repeats=open" && item.count === 1));
});

test("a double-sent message is confirmed on its own; a resend waits for staff", async () => {
  const { scanList } = mod("lib/duplicates/scan.ts");
  const { matchesFor } = mod("lib/duplicates/review.ts");
  const first = await insertMessage({ at: minutesAgo(30) });
  const doubled = await insertMessage({ at: minutesAgo(28) });
  const other = await insertMessage({ email: "kim@example.org", phone: "+1 5550101234", body: "Is the pavilion open on Sundays?", at: minutesAgo(27) });
  await scanList(getDb(), "messages");
  const [auto] = await matchesFor(getDb(), "messages", doubled);
  assert.equal(auto.other.id, first);
  assert.equal(auto.status, "confirmed");
  assert.equal(auto.automatic, true);
  assert.deepEqual(await matchesFor(getDb(), "messages", other), []);
});

test("an entry in one form never matches an entry in another", async () => {
  const { scanList } = mod("lib/duplicates/scan.ts");
  const { matchesFor } = mod("lib/duplicates/review.ts");
  const applicant = await insertApplicant({ name: "Wangari Maathai", email: "wangari@example.org", phone: "+254 700111222" });
  await insertMessage({ name: "Wangari Maathai", email: "wangari@example.org", phone: "+254 700111222", body: "Question about my application status." });
  await scanList(getDb(), "applicants");
  await scanList(getDb(), "messages");
  assert.deepEqual(await matchesFor(getDb(), "applicants", applicant), []);
});

test("the worker only rescans a list after something new arrives", async () => {
  const { scanIfStale, scanAllIfStale } = mod("lib/duplicates/scan.ts");
  await scanIfStale(getDb(), "partners");
  assert.equal((await scanIfStale(getDb(), "partners")).skipped, true);
  await sql.query(
    "insert into partner_inquiries (name, email, organization, designation, support) values ('Kofi A', 'kofi@ngo.org', 'Green Earth', 'Director', 'funding')",
  );
  assert.equal((await scanIfStale(getDb(), "partners")).skipped, false);
  assert.equal((await scanIfStale(getDb(), "partners")).skipped, true);
  const all = await scanAllIfStale(getDb());
  assert.equal(all.length, 3);
});
