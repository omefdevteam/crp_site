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
  process.env.APP_URL = "https://crp.test";
  process.env.NODE_ENV = "test";
  process.env.ADMIN_EMAILS = "admin@example.org";
  sql = new pg.Client({ connectionString: db.url });
  await sql.connect();
  load = loader({
    "next/cache": { unstable_cache: (fn) => fn, updateTag() {}, revalidatePath() {}, revalidateTag() {} },
    "next/headers": {
      headers: async () => new Headers(),
      cookies: async () => ({ get: () => undefined, set() {}, delete() {} }),
    },
    "next/navigation": { redirect: (url) => { throw new Error(`redirect ${url}`); }, notFound: () => { throw new Error("not found"); } },
  });
});

after(async () => {
  try { await load("lib/db/index.ts").closeDb(); } catch { /* pool may already be closed */ }
  try { await sql.end(); } catch { /* ignore */ }
  try { await db.stop(); } catch { /* ignore */ }
});

const mod = (path) => load(path);
const getDb = () => mod("lib/db/index.ts").getDb();

let seq = 0;
async function applicant(status, extra = {}) {
  seq += 1;
  const email = extra.email ?? `amb-${seq}@example.org`;
  const { rows } = await sql.query(
    `insert into applicants (full_name, email, dob, age, track, language, status, based_in)
     values ($1, $2, '1998-04-02', 28, 'in_person', $3, $4, $5) returning id`,
    [extra.fullName ?? "Amara Okafor Diallo", email, extra.language ?? "fr", status, extra.basedIn ?? "Kenya"],
  );
  return { id: rows[0].id, email };
}

async function move(applicantId, to) {
  const { transition } = mod("lib/lifecycle.ts");
  return getDb().transaction((tx) => transition(tx, { applicantId, to, reason: "test", actor: "system" }));
}

async function ambassadorFor(applicantId) {
  const { rows } = await sql.query("select * from ambassadors where applicant_id = $1", [applicantId]);
  return rows[0];
}

async function welcomeJobs(applicantId) {
  const { rows } = await sql.query("select * from jobs where dedupe_key = $1", [`ambassador-welcome:${applicantId}`]);
  return rows;
}

test("only accepted and later statuses count as Ambassador statuses", () => {
  const { isAmbassadorStatus } = mod("lib/ambassador/status.ts");
  for (const status of ["accepted", "interview_yes", "docs_submitted", "onboarding", "online"]) assert.equal(isAmbassadorStatus(status), true, status);
  for (const status of ["submitted", "under_review", "rejected", "interview_no", "online_offered", "ineligible"]) assert.equal(isAmbassadorStatus(status), false, status);
});

test("the default display name is the first name only", () => {
  const { defaultDisplayName } = mod("lib/ambassador/provision.ts");
  assert.equal(defaultDisplayName("  Amara Okafor Diallo "), "Amara");
  assert.equal(defaultDisplayName(""), "Ambassador");
  assert.equal(defaultDisplayName("x".repeat(90)).length, 60);
});

test("acceptance opens one account and queues one welcome email", async () => {
  const { id, email } = await applicant("under_review");
  assert.equal(await ambassadorFor(id), undefined);

  const accepted = await move(id, "accepted");
  assert.equal(accepted.ok, true);
  const account = await ambassadorFor(id);
  assert.equal(account.email, email);
  assert.equal(account.display_name, "Amara");
  assert.equal(account.home_country, "KE");
  assert.equal(account.language, "fr");
  assert.equal(account.show_on_globe, false);
  const jobs = await welcomeJobs(id);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].payload.to, email);
  assert.equal(jobs[0].payload.subject, "Bienvenue, Ambassadeur·rice");
  assert.match(jobs[0].payload.html, /https:\/\/crp\.test\/fr\/ambassador\/sign-in/);
  // The welcome email carries no sign-in code.
  assert.doesNotMatch(jobs[0].payload.html, /token=/);

  assert.equal((await move(id, "interview_yes")).ok, true);
  assert.equal((await welcomeJobs(id)).length, 1);
  const { rows } = await sql.query("select count(*)::int as n from ambassadors where applicant_id = $1", [id]);
  assert.equal(rows[0].n, 1);
});

test("a rejection does not open an account", async () => {
  const { id } = await applicant("under_review");
  assert.equal((await move(id, "rejected")).ok, true);
  assert.equal(await ambassadorFor(id), undefined);
  assert.equal((await welcomeJobs(id)).length, 0);
});

test("a sign-in link works once and opens a member session", async () => {
  const auth = mod("lib/ambassador/auth.ts");
  const { id, email } = await applicant("under_review");
  await move(id, "accepted");

  assert.equal(await auth.issueMemberLink(getDb(), "nobody@example.org"), null);
  const issued = await auth.issueMemberLink(getDb(), email.toUpperCase());
  assert.ok(issued);

  const first = await auth.redeemMemberLink(getDb(), issued.raw);
  assert.ok(first);
  assert.equal(await auth.redeemMemberLink(getDb(), issued.raw), null);

  const member = await auth.readMember(getDb(), first.session);
  assert.equal(member.email, email);
  assert.equal(member.displayName, "Amara");

  await auth.revokeMemberSession(getDb(), first.session);
  assert.equal(await auth.readMember(getDb(), first.session), null);
});

test("an expired link is refused", async () => {
  const auth = mod("lib/ambassador/auth.ts");
  const { id, email } = await applicant("under_review");
  await move(id, "accepted");
  const issued = await auth.issueMemberLink(getDb(), email);
  await sql.query("update ambassador_sign_in_tokens set expires_at = now() - interval '1 minute' where hash = $1", [issued.hash]);
  assert.equal(await auth.redeemMemberLink(getDb(), issued.raw), null);
});

test("member and staff credentials never open each other's area", async () => {
  const auth = mod("lib/ambassador/auth.ts");
  const staff = mod("lib/staff/auth.ts");
  const { id, email } = await applicant("under_review");
  await move(id, "accepted");

  const memberLink = await auth.issueMemberLink(getDb(), email);
  assert.equal(await staff.redeemSignInLink(getDb(), memberLink.raw), null);
  const memberSession = await auth.redeemMemberLink(getDb(), memberLink.raw);
  assert.equal(await staff.readStaff(getDb(), memberSession.session), null);

  // An accepted applicant's address is not a staff address.
  assert.equal(await staff.issueSignInLink(getDb(), email), null);

  const staffLink = await staff.issueSignInLink(getDb(), "admin@example.org");
  assert.ok(staffLink);
  assert.equal(await auth.redeemMemberLink(getDb(), staffLink.raw), null);
  const staffSession = await staff.redeemSignInLink(getDb(), staffLink.raw);
  assert.equal(await auth.readMember(getDb(), staffSession.session), null);
});

test("leaving an Ambassador status closes sign-in at once and reopens on return", async () => {
  const auth = mod("lib/ambassador/auth.ts");
  const { id, email } = await applicant("under_review");
  await move(id, "accepted");
  const link = await auth.issueMemberLink(getDb(), email);
  const pending = await auth.issueMemberLink(getDb(), email);
  const session = await auth.redeemMemberLink(getDb(), link.raw);
  assert.ok(await auth.readMember(getDb(), session.session));

  assert.equal((await move(id, "rejected")).ok, true);
  assert.equal(await auth.readMember(getDb(), session.session), null);
  assert.equal(await auth.issueMemberLink(getDb(), email), null);
  // A link sent before the change cannot be spent after it.
  assert.equal(await auth.redeemMemberLink(getDb(), pending.raw), null);

  assert.equal((await move(id, "accepted")).ok, true);
  assert.ok(await auth.readMember(getDb(), session.session));
  assert.equal((await welcomeJobs(id)).length, 1);
});

test("a disabled Ambassador cannot sign in", async () => {
  const auth = mod("lib/ambassador/auth.ts");
  const { id, email } = await applicant("under_review");
  await move(id, "accepted");
  const session = await auth.redeemMemberLink(getDb(), (await auth.issueMemberLink(getDb(), email)).raw);
  await sql.query("update ambassadors set disabled_at = now() where applicant_id = $1", [id]);
  assert.equal(await auth.readMember(getDb(), session.session), null);
  assert.equal(await auth.issueMemberLink(getDb(), email), null);
});

test("backfill opens accounts for earlier acceptances once", async () => {
  const { backfillAmbassadors, countMissingAmbassadors } = mod("lib/ambassador/provision.ts");
  const early = await applicant("accepted", { language: "es", basedIn: "Atlantis" });
  const later = await applicant("onboarding", { language: "en" });
  const notYet = await applicant("under_review");
  assert.ok((await countMissingAmbassadors(getDb())) >= 2);

  const first = await backfillAmbassadors(getDb());
  assert.ok(first.created >= 2);
  assert.equal(await countMissingAmbassadors(getDb()), 0);
  const account = await ambassadorFor(early.id);
  assert.equal(account.language, "es");
  assert.equal(account.home_country, null);
  assert.ok(await ambassadorFor(later.id));
  assert.equal(await ambassadorFor(notYet.id), undefined);
  assert.equal((await welcomeJobs(early.id))[0].payload.subject, "Bienvenido/a, Embajador/a");

  assert.deepEqual(await backfillAmbassadors(getDb()), { created: 0 });
  assert.equal((await welcomeJobs(early.id)).length, 1);
});

test("the stories table refuses a sent story that is missing what the globe shows", async () => {
  const { id } = await applicant("under_review");
  await move(id, "accepted");
  const account = await ambassadorFor(id);

  const { rows } = await sql.query("insert into stories (ambassador_id, kind) values ($1, 'beacon') returning status", [account.id]);
  assert.equal(rows[0].status, "draft");

  await assert.rejects(
    sql.query("insert into stories (ambassador_id, kind, status, title) values ($1, 'beacon', 'submitted', 'Half done')", [account.id]),
    /stories_complete_when_sent/,
  );
  await assert.rejects(
    sql.query("insert into stories (ambassador_id, kind) values ($1, 'ambassador')", [account.id]),
    /stories_kind/,
  );
  await assert.rejects(
    sql.query(
      `insert into stories (ambassador_id, kind, status, title, body, country, city, lat, lng, submitted_at)
       values ($1, 'mission', 'approved', 'T', 'B', 'KE', 'Nairobi', -1.29, 36.82, now())`,
      [account.id],
    ),
    /stories_published_when_approved/,
  );
  await sql.query(
    `insert into stories (ambassador_id, kind, status, title, body, country, city, lat, lng, submitted_at, published_at)
     values ($1, 'mission', 'approved', 'T', 'B', 'KE', 'Nairobi', -1.29, 36.82, now(), now())`,
    [account.id],
  );
  await assert.rejects(
    sql.query("update ambassadors set show_on_globe = true where id = $1", [account.id]),
    /ambassadors_globe_needs_home/,
  );
});

test("Ambassador pages keep their language prefix when switching language", () => {
  const { localePath, isMemberSitePath } = mod("lib/locale.ts");
  assert.equal(localePath("/fr/ambassador", "pt"), "/pt/ambassador");
  assert.equal(localePath("/en/ambassador/sign-in?error=link", "es"), "/es/ambassador/sign-in?error=link");
  assert.equal(isMemberSitePath("/ambassadors"), false);
  assert.equal(localePath("/admin", "fr"), "/admin");
  const { memberSignInLink, isMemberPath } = mod("lib/ambassador/link.ts");
  assert.equal(memberSignInLink("https://crp.test", "es", "a b"), "https://crp.test/es/ambassador/confirm#token=a%20b");
  assert.equal(isMemberPath("/es/ambassador/confirm"), true);
  assert.equal(isMemberPath("/es/ambassadorship"), false);
});

test("the proxy serves /{lang}/ambassador from its own folder and hides that folder", async () => {
  const { NextRequest } = await import("next/server.js");
  const { proxy } = mod("proxy.ts");
  const hit = (path, cookie) => proxy(new NextRequest(`https://crp.test${path}`, cookie ? { headers: { cookie } } : {}));

  const page = hit("/fr/ambassador/stories/abc");
  assert.equal(page.headers.get("x-middleware-rewrite"), "https://crp.test/ambassador-space/fr/stories/abc");
  assert.equal(page.headers.get("cache-control"), "private, no-store");
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.equal(hit("/es/ambassador").headers.get("x-middleware-rewrite"), "https://crp.test/ambassador-space/es");
  assert.equal(hit("/fr/ambassador/confirm").headers.get("referrer-policy"), "no-referrer");

  assert.equal(hit("/ambassador-space/fr").status, 404);
  assert.equal(hit("/ambassador-space/fr/profile").status, 404);

  const bare = hit("/ambassador/sign-in", "crp-locale=pt");
  assert.equal(bare.status, 307);
  assert.equal(new URL(bare.headers.get("location")).pathname, "/pt/ambassador/sign-in");

  // Public pages are untouched.
  assert.equal(hit("/fr/about").headers.get("x-middleware-rewrite"), null);
  assert.equal(hit("/fr/ambassadorship").headers.get("x-middleware-rewrite"), null);
});

test("the language switch names the public address on an Ambassador page", () => {
  const { sitePath } = mod("components/LanguageProvider.tsx");
  assert.equal(sitePath("/fr/ambassador/profile"), "/ambassador/profile");
  assert.equal(sitePath("/ambassador-space/fr/profile"), "/ambassador/profile");
  assert.equal(sitePath("/ambassador-space/fr"), "/ambassador");
  assert.equal(sitePath("/fr/admin"), "/");
});

test("Ambassador page text exists in every language", () => {
  const { uiMessages } = mod("lib/ui-messages.ts");
  for (const key of ["Ambassador sign in", "Email me a sign-in link", "Your Ambassador space", "Welcome, {name}.", "Sign out"]) {
    for (const locale of ["en", "fr", "es", "pt"]) assert.ok(uiMessages[locale][key], `${locale}: ${key}`);
  }
  assert.ok(uiMessages.fr["Welcome, {name}."].includes("{name}"));
});

// ---- Phase 2: stories, places, photos, profile ----

async function signedInMember(extra = {}) {
  const { id } = await applicant("under_review", extra);
  await move(id, "accepted");
  const account = await ambassadorFor(id);
  return { id: account.id, applicantId: id, email: account.email, displayName: account.display_name, language: account.language };
}

function nairobi() {
  const { searchCities } = mod("lib/places/search.ts");
  const [hit] = searchCities("KE", "nairo");
  return hit;
}

function fakeStore() {
  const files = new Map();
  return {
    files,
    async put(pathname, bytes, contentType) {
      if (files.has(pathname)) throw new Error("exists");
      files.set(pathname, { bytes, contentType });
    },
    async read(pathname) {
      return files.has(pathname) ? new Blob([files.get(pathname).bytes]).stream() : null;
    },
    async remove(pathname) {
      files.delete(pathname);
    },
  };
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const draftAt = (placeId, extra = {}) => ({ kind: "beacon", title: "T", body: "B", language: "en", placeId, ...extra });

test("city search finds places by prefix, ignoring accents, within one country", () => {
  const { searchCities, placeById, placeByName, fold } = mod("lib/places/search.ts");
  assert.equal(fold("São Paulo"), "sao paulo");
  const [first] = searchCities("KE", "nairo");
  assert.equal(first.name, "Nairobi");
  assert.ok(Math.abs(first.lat - -1.283) < 0.05);
  assert.deepEqual(placeById(first.id), first);
  assert.equal(searchCities("BR", "sao pa")[0].name, "São Paulo");
  assert.equal(searchCities("KE", "").length, 0);
  assert.equal(searchCities("ZZ", "a").length, 0);
  assert.ok(searchCities("FR", "saint").every((place) => place.country === "FR"));
  assert.equal(placeById(-1), null);
  assert.equal(placeById(10_000_000), null);
  assert.equal(placeByName("KE", "nairobi").name, "Nairobi");
});

test("draft parsing trims, keeps line breaks and refuses bad shapes", () => {
  const { parseDraft, BODY_MAX } = mod("lib/ambassador/story-model.ts");
  const ok = parseDraft({ kind: "beacon", title: "  River  ", body: "One\r\nTwo\u0007", language: "pt", placeId: "42" });
  assert.deepEqual(ok, { ok: true, draft: { kind: "beacon", title: "River", body: "One\nTwo", language: "pt", placeId: 42 } });
  assert.equal(parseDraft({ kind: "beacon", title: "", body: "", language: "en", placeId: "" }).draft.title, null);
  assert.equal(parseDraft({ kind: "ambassador", language: "en" }).problem, "kind");
  assert.equal(parseDraft({ kind: "mission", language: "de" }).problem, "language");
  assert.equal(parseDraft({ kind: "mission", language: "en", placeId: "-3" }).problem, "place");
  assert.equal(parseDraft({ kind: "mission", language: "en", body: "x".repeat(BODY_MAX + 1) }).problem, "body_long");
  // An emoji counts as one character.
  assert.equal(parseDraft({ kind: "mission", language: "en", body: "🌍".repeat(BODY_MAX) }).ok, true);
});

test("photo type comes from the file's bytes, not its name", () => {
  const { sniffPhoto } = mod("lib/ambassador/story-model.ts");
  assert.equal(sniffPhoto(JPEG), "image/jpeg");
  assert.equal(sniffPhoto(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(sniffPhoto(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  assert.equal(sniffPhoto(new TextEncoder().encode("<svg onload=alert(1)>")), null);
  assert.equal(sniffPhoto(new TextEncoder().encode("GIF89a")), null);
});

test("a story goes from draft to review, and is locked while there", async () => {
  const stories = mod("lib/ambassador/stories.ts");
  const member = await signedInMember();
  const place = nairobi();

  const created = await stories.saveStory(getDb(), member, null, { kind: "beacon", title: "Flood season", body: null, language: "en", placeId: null }, null);
  assert.equal(created.ok, true);
  let row = await stories.getMyStory(getDb(), member.id, created.id);
  assert.equal(row.status, "draft");
  assert.equal(row.version, 0);

  assert.deepEqual(await stories.submitStory(getDb(), member, created.id, null), { ok: false, reason: "incomplete", missing: ["body", "place"] });

  const saved = await stories.saveStory(getDb(), member, created.id, draftAt(place.id, { title: "Flood season", body: "The river rose early." }), 0);
  assert.equal(saved.ok, true);
  row = await stories.getMyStory(getDb(), member.id, created.id);
  assert.equal(row.city, "Nairobi");
  assert.equal(row.country, "KE");
  assert.equal(row.lat, place.lat);

  // A form built from version 0 is refused once the story has moved on.
  assert.deepEqual(await stories.saveStory(getDb(), member, created.id, draftAt(null), 0), { ok: false, reason: "stale" });

  assert.equal((await stories.submitStory(getDb(), member, created.id, 1)).ok, true);
  row = await stories.getMyStory(getDb(), member.id, created.id);
  assert.equal(row.status, "submitted");
  assert.ok(row.submittedAt);

  assert.deepEqual(await stories.saveStory(getDb(), member, created.id, draftAt(place.id), null), { ok: false, reason: "locked" });
  assert.deepEqual(await stories.deleteStory(getDb(), member, created.id, null), { ok: false, reason: "locked" });

  assert.equal((await stories.withdrawStory(getDb(), member, created.id)).ok, true);
  assert.equal((await stories.getMyStory(getDb(), member.id, created.id)).status, "withdrawn");
  assert.equal((await stories.saveStory(getDb(), member, created.id, draftAt(place.id, { kind: "mission" }), null)).ok, true);
  assert.equal((await stories.getMyStory(getDb(), member.id, created.id)).status, "draft");

  const { rows } = await sql.query("select from_status, to_status, actor from story_events where story_id = $1 order by created_at, id", [created.id]);
  assert.deepEqual(rows.map((r) => `${r.from_status}>${r.to_status}`), ["null>draft", "draft>submitted", "submitted>withdrawn", "withdrawn>draft"]);
  assert.ok(rows.every((r) => r.actor === "ambassador"));
});

test("an Ambassador cannot see or change someone else's story", async () => {
  const stories = mod("lib/ambassador/stories.ts");
  const owner = await signedInMember();
  const other = await signedInMember();
  const created = await stories.saveStory(getDb(), owner, null, draftAt(null, { title: "Mine" }), null);
  assert.equal(await stories.getMyStory(getDb(), other.id, created.id), null);
  assert.deepEqual(await stories.saveStory(getDb(), other, created.id, draftAt(null, { title: "Theirs" }), null), { ok: false, reason: "not_found" });
  assert.deepEqual(await stories.withdrawStory(getDb(), other, created.id), { ok: false, reason: "not_found" });
  assert.deepEqual(await stories.deleteStory(getDb(), other, created.id, null), { ok: false, reason: "not_found" });
  assert.equal(await stories.getMyStory(getDb(), owner.id, "not-a-uuid"), null);
});

test("an Ambassador can have at most five stories waiting for review", async () => {
  const stories = mod("lib/ambassador/stories.ts");
  const member = await signedInMember();
  const place = nairobi();
  for (let i = 0; i < 5; i++) {
    const made = await stories.saveStory(getDb(), member, null, draftAt(place.id), null);
    assert.equal((await stories.submitStory(getDb(), member, made.id, null)).ok, true);
  }
  const sixth = await stories.saveStory(getDb(), member, null, draftAt(place.id), null);
  assert.deepEqual(await stories.submitStory(getDb(), member, sixth.id, null), { ok: false, reason: "pending_limit" });
});

test("photos are checked, replaced cleanly and private until approval", async () => {
  const stories = mod("lib/ambassador/stories.ts");
  const member = await signedInMember();
  const other = await signedInMember();
  const store = fakeStore();
  const created = await stories.saveStory(getDb(), member, null, draftAt(nairobi().id), null);

  assert.deepEqual(await stories.setStoryPhoto(getDb(), member, created.id, null, { bytes: JPEG, size: JPEG.length }), { ok: false, reason: "no_store" });
  const svg = new TextEncoder().encode("<svg/>");
  assert.deepEqual(await stories.setStoryPhoto(getDb(), member, created.id, store, { bytes: svg, size: svg.length }), { ok: false, reason: "photo_type" });
  assert.deepEqual(await stories.setStoryPhoto(getDb(), member, created.id, store, { bytes: JPEG, size: 5 * 1024 * 1024 }), { ok: false, reason: "photo_size" });
  assert.equal(store.files.size, 0);

  assert.equal((await stories.setStoryPhoto(getDb(), member, created.id, store, { bytes: JPEG, size: JPEG.length })).ok, true);
  const firstPath = [...store.files.keys()][0];
  assert.match(firstPath, new RegExp(`^story-photos/${created.id}/[0-9a-f-]+\\.jpg$`));
  assert.equal((await stories.setStoryPhoto(getDb(), member, created.id, store, { bytes: JPEG, size: JPEG.length })).ok, true);
  assert.equal(store.files.size, 1);
  assert.notEqual([...store.files.keys()][0], firstPath);

  assert.equal(await stories.photoFor(getDb(), created.id, { kind: "public" }), null);
  assert.equal(await stories.photoFor(getDb(), created.id, { kind: "member", ambassadorId: other.id }), null);
  assert.equal((await stories.photoFor(getDb(), created.id, { kind: "member", ambassadorId: member.id })).public, false);

  await stories.submitStory(getDb(), member, created.id, null);
  await sql.query("update stories set status = 'approved', published_at = now(), reviewed_at = now() where id = $1", [created.id]);
  assert.equal((await stories.photoFor(getDb(), created.id, { kind: "public" })).public, true);

  assert.equal((await stories.withdrawStory(getDb(), member, created.id)).ok, true);
  assert.equal(await stories.photoFor(getDb(), created.id, { kind: "public" }), null);

  assert.equal((await stories.deleteStory(getDb(), member, created.id, store)).ok, true);
  assert.equal(store.files.size, 0);
});

test("profile changes keep the globe opt-in tied to a home city", async () => {
  const { parseProfile } = mod("lib/ambassador/story-model.ts");
  const { getProfile, updateProfile } = mod("lib/ambassador/profile.ts");
  const member = await signedInMember();
  const place = nairobi();

  assert.equal(parseProfile({ displayName: " ", language: "en" }).problem, "name");
  assert.equal(parseProfile({ displayName: "A", language: "en", showOnGlobe: "on", homePlaceId: "" }).problem, "globe_needs_home");
  assert.equal(parseProfile({ displayName: "A\nB", language: "en" }).problem, "name_long");

  const parsed = parseProfile({ displayName: "Amara O.", bio: "Water and soil.", homePlaceId: String(place.id), showOnGlobe: "on", language: "pt" });
  assert.deepEqual(await updateProfile(getDb(), member.id, parsed.profile), { ok: true });
  let profile = await getProfile(getDb(), member.id);
  assert.equal(profile.displayName, "Amara O.");
  assert.equal(profile.homeCity, "Nairobi");
  assert.equal(profile.showOnGlobe, true);
  assert.equal(profile.home.id, place.id);
  assert.equal(profile.language, "pt");

  const kept = parseProfile({ displayName: "Amara", homePlaceId: "keep", showOnGlobe: "on", language: "pt" });
  assert.deepEqual(await updateProfile(getDb(), member.id, kept.profile), { ok: true });
  assert.equal((await getProfile(getDb(), member.id)).homeCity, "Nairobi");

  const cleared = parseProfile({ displayName: "Amara", homePlaceId: "", language: "pt" });
  assert.deepEqual(await updateProfile(getDb(), member.id, cleared.profile), { ok: true });
  profile = await getProfile(getDb(), member.id);
  assert.equal(profile.homeCity, null);
  assert.equal(profile.showOnGlobe, false);
});

test("phase 2 page text exists in every language", () => {
  const { uiMessages } = mod("lib/ui-messages.ts");
  for (const key of ["Send for review", "Live on the globe", "Show me on the Ambassadors map", "Place data © GeoNames (CC BY 4.0)", "Home city"]) {
    for (const locale of ["en", "fr", "es", "pt"]) assert.ok(uiMessages[locale][key], `${locale}: ${key}`);
  }
  assert.equal(uiMessages.fr.Home, undefined);
});
