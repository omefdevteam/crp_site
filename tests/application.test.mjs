import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import pg from "pg";
import { loader } from "./helpers.mjs";
import { startDatabase } from "./db.mjs";

// End-to-end through the real application code against a disposable Postgres:
// server actions, webhook routes, the review-sheet endpoint, the sync feed, the
// job worker, and the ops actions. Only the network edges are replaced: Resend,
// Turnstile, the identity provider, and Next's request helpers.

let db, sql, h;

before(async () => {
  db = await startDatabase();
  process.env.DATABASE_URL = db.url;
  process.env.APP_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.SYNC_API_SECRET = "sync";
  process.env.VIDEOASK_WEBHOOK_SECRET = "videoask";
  process.env.OPERATIONS_SECRET = "ops";
  process.env.CRON_SECRET = "cron";
  process.env.VIDEOASK_ROUND1_URL_EN = "https://videoask.invalid/r1-en";
  process.env.VIDEOASK_ROUND2_URL_EN = "https://videoask.invalid/r2-en";
  sql = new pg.Client({ connectionString: db.url });
  await sql.connect();
  h = harness();
});

after(async () => {
  try { await h?.load("lib/db/index.ts").closeDb(); } catch { /* setup may have failed before the pool existed */ }
  try { await sql?.end(); } catch { /* ignore */ }
  try { await db?.stop(); } catch { /* ignore */ }
});

let ipCounter = 0;
let emailCounter = 0;
const nextEmail = () => `applicant${++emailCounter}@example.invalid`;
const dobFor = (age) => `${new Date().getUTCFullYear() - age}-01-15`;

function harness() {
  const state = {
    ip: `10.0.0.${++ipCounter}`,
    cookies: [],
    delivered: [],
    deliver: async () => ({ ok: true, id: `re_${state.delivered.length + 1}` }),
    sessions: [],
    emailsThrow: false,
  };
  const realEmails = loader()("lib/emails.ts");
  const mocks = {
    "next/headers": {
      headers: async () => new Headers({ "x-forwarded-for": state.ip }),
      cookies: async () => ({ set: (...args) => state.cookies.push(args) }),
    },
    "next/server": {
      NextResponse: {
        json: (body, init) => ({ body, status: init?.status ?? 200 }),
        redirect: (url) => {
          const res = { url: String(url), status: 307, setCookies: [] };
          res.cookies = { set: (...args) => res.setCookies.push(args) };
          return res;
        },
      },
    },
    "@/lib/turnstile": { verifyTurnstile: async () => true },
    "@/lib/email": {
      deliverEmail: async (input, key) => {
        const result = await state.deliver(input, key);
        if (result.ok) state.delivered.push({ ...input, key });
        return result;
      },
    },
    "@/lib/emails": new Proxy(realEmails, {
      get: (target, name) => (name === "applicationEmail" && state.emailsThrow
        ? () => { throw new Error("template exploded"); }
        : target[name]),
    }),
    "@/lib/identity": {
      getIdentityProvider: () => ({
        name: "test",
        verify: () => true,
        parse: (body) => ({ reference: body.reference ?? null, sessionId: body.sessionId ?? null, decision: body.decision ?? "pending", occurredAt: body.occurredAt ? new Date(body.occurredAt) : null, eventId: body.eventId ?? null }),
        createSession: async (applicantId) => {
          const id = `session-${state.sessions.length + 1}`;
          state.sessions.push({ applicantId, id });
          return { sessionId: id, url: `https://identity.invalid/${id}` };
        },
      }),
    },
  };
  const load = loader(mocks);
  const req = (url, init = {}) => ({
    headers: new Headers(init.headers ?? {}),
    nextUrl: new URL(url, "https://example.invalid"),
    cookies: { get: (name) => (init.cookies?.[name] ? { value: init.cookies[name] } : undefined) },
    text: async () => init.body ?? "",
    json: async () => JSON.parse(init.body ?? "null"),
  });
  const routes = {
    identity: (body, extra = {}) => load("app/api/webhooks/identity/route.ts").POST(req("/api/webhooks/identity", { body: JSON.stringify(body), ...extra })),
    videoask: (stage, applicantId, body = {}) => load("app/api/webhooks/videoask/route.ts").POST(req(`/api/webhooks/videoask?stage=${stage}`, { headers: { "x-webhook-secret": "videoask" }, body: JSON.stringify({ applicant_id: applicantId, ...body }) })),
    resend: null,
    decisions: (rows) => load("app/api/decisions/route.ts").POST(req("/api/decisions", { headers: { "x-sync-secret": "sync" }, body: JSON.stringify(rows) })),
    sync: (table, query) => load("app/api/sync/[table]/route.ts").GET(req(`/api/sync/${table}?${query}`, { headers: { "x-sync-secret": "sync" } }), { params: Promise.resolve({ table }) }),
    verify: (cookies, query = "") => load("app/api/apply/verify/route.ts").GET(req(`/api/apply/verify${query}`, { cookies })),
    resume: (token) => load("app/api/apply/resume/route.ts").GET(req(`/api/apply/resume?token=${encodeURIComponent(token)}`)),
    cron: () => load("app/api/cron/jobs/route.ts").GET(req("/api/cron/jobs", { headers: { authorization: "Bearer cron" } })),
    excel: () => load("app/api/cron/excel/route.ts").GET(req("/api/cron/excel", { headers: { authorization: "Bearer cron" } })),
    ops: (body) => load("app/api/ops/route.ts").POST(req("/api/ops", { headers: { "x-ops-secret": "ops", "x-operator": "tester" }, body: JSON.stringify(body) })),
    opsOverview: () => load("app/api/ops/route.ts").GET(req("/api/ops", { headers: { "x-ops-secret": "ops" } })),
  };
  const actions = load("lib/actions.ts");
  const apply = async (overrides = {}) => {
    const { ip, ...fields } = overrides;
    state.ip = ip ?? `10.2.${Math.floor(ipCounter / 250) % 250}.${(ipCounter++ % 250) + 1}`;
    return actions.startApplication({ fullName: "Ada Lovelace", email: nextEmail(), dob: dobFor(22), language: "en", track: "in_person", skills: ["Agriculture & Food"], canTravel: true, hasValidPassport: true, ...fields });
  };
  return { state, load, actions, apply, ...routes };
}

const row = async (table, id) => (await sql.query(`select * from ${table} where id = $1`, [id])).rows[0];
const count = async (table, where = "true", params = []) => Number((await sql.query(`select count(*)::int as n from ${table} where ${where}`, params)).rows[0].n);
const jobsFor = (applicantId) => sql.query("select * from jobs where applicant_id = $1 order by created_at", [applicantId]).then((r) => r.rows);
const setStatus = (id, status) => sql.query("update applicants set status = $2 where id = $1", [id, status]);

test("an application commits the applicant, consent, history, and confirmation email together", async () => {
  const result = await h.apply();
  assert.equal(result.ok, true);
  const applicant = await row("applicants", result.id);
  assert.equal(applicant.status, "submitted");
  assert.equal(applicant.version, 0);
  assert.equal(await count("consent_log", "applicant_id = $1", [result.id]), 1);
  assert.equal(await count("application_events", "applicant_id = $1 and to_status = 'submitted'", [result.id]), 1);
  const jobs = await jobsFor(result.id);
  assert.deepEqual(jobs.map((j) => [j.kind, j.status, j.payload.template]), [["email", "pending", "application"]]);
  assert.equal(await count("sync_changes", "record_id = $1 and operation = 'insert'", [result.id]), 1);
  // The session cookie is signed, not the raw id.
  assert.equal(h.state.cookies.length, 1);
  assert.notEqual(h.state.cookies[0][1], result.id);
  assert.match(h.state.cookies[0][1], new RegExp(`^${result.id}\\.\\d+\\.`));
});

test("a failure after the applicant insert rolls everything back", async () => {
  const email = nextEmail();
  h.state.emailsThrow = true;
  await assert.rejects(h.apply({ email }));
  h.state.emailsThrow = false;
  assert.equal(await count("applicants", "email = $1", [email]), 0);
  assert.equal(await count("jobs", "payload->>'to' = $1", [email]), 0);
});

test("input is normalized: mixed-case email dedupes, impossible dates are refused", async () => {
  const email = nextEmail();
  const first = await h.apply({ email: ` ${email.toUpperCase()} ` });
  assert.equal(first.ok, true);
  assert.equal((await row("applicants", first.id)).email, email);
  const second = await h.apply({ email });
  assert.deepEqual(second, { ok: false, reason: "existing" });
  assert.deepEqual(await h.apply({ dob: `${new Date().getUTCFullYear() - 22}-02-30` }), { ok: false, reason: "invalid" });
});

test("skills and travel attestations are required for an in-person application", async () => {
  assert.deepEqual(await h.apply({ skills: [] }), { ok: false, reason: "invalid" });
  assert.deepEqual(await h.apply({ skills: ["Not a skill"] }), { ok: false, reason: "invalid" });
  assert.deepEqual(await h.apply({ canTravel: false }), { ok: false, reason: "invalid" });
  const online = await h.apply({ track: "online", canTravel: false, hasValidPassport: false });
  assert.equal(online.ok, true);
  const storedOnline = await row("applicants", online.id);
  assert.deepEqual(storedOnline.skills, ["Agriculture & Food"]);
  assert.equal(storedOnline.can_travel, null);
  assert.equal(storedOnline.has_valid_passport, null);
  const traveller = await h.apply({ skills: ["AI & Data", "Energy"] });
  assert.equal(traveller.ok, true);
  const stored = await row("applicants", traveller.id);
  assert.deepEqual(stored.skills, ["AI & Data", "Energy"]);
  assert.equal(stored.can_travel, true);
  assert.equal(stored.has_valid_passport, true);
});

test("an existing email grants no session and no email; a resume link is single-use and signs in", async () => {
  const first = await h.apply();
  const cookiesBefore = h.state.cookies.length;
  const jobsBefore = (await jobsFor(first.id)).length;
  const again = await h.apply({ email: (await row("applicants", first.id)).email, fullName: "Someone else" });
  assert.deepEqual(again, { ok: false, reason: "existing" });
  assert.equal(h.state.cookies.length, cookiesBefore);
  assert.equal((await jobsFor(first.id)).length, jobsBefore);

  // Asking for a link queues one email carrying a token stored only as a hash.
  const asked = await h.actions.requestApplicationLink({ email: (await row("applicants", first.id)).email });
  assert.deepEqual(asked, { ok: true });
  const unknown = await h.actions.requestApplicationLink({ email: "nobody@example.invalid" });
  assert.deepEqual(unknown, { ok: true });
  const [resumeJob] = (await jobsFor(first.id)).filter((j) => j.payload.template === "resume");
  const token = new URL(resumeJob.payload.html.match(/href="([^"]+\/api\/apply\/resume[^"]+)"/)[1]).searchParams.get("token");
  assert.equal(await count("access_tokens", "applicant_id = $1 and used_at is null", [first.id]), 1);
  assert.equal(await count("access_tokens", "hash = $1", [token]), 0);

  const landed = await h.resume(token);
  assert.equal(landed.url, "https://videoask.invalid/r1-en?applicant_id=" + first.id);
  assert.equal(landed.setCookies[0][0], "crp_session");
  const replay = await h.resume(token);
  assert.match(replay.url, /resume=expired/);
});

test("the verify hand-off trusts the signed session, never the echoed applicant id", async () => {
  const a = await h.apply();
  const { signSession } = h.load("lib/session.ts");
  const noSession = await h.verify({}, `?applicant_id=${a.id}`);
  assert.equal(noSession.url, "https://example.invalid/apply");
  const forged = await h.verify({ crp_session: `${a.id}.9999999999.forged` });
  assert.equal(forged.url, "https://example.invalid/apply");

  const first = await h.verify({ crp_session: signSession(a.id) });
  assert.match(first.url, /^https:\/\/identity\.invalid\/session-/);
  const second = await h.verify({ crp_session: signSession(a.id) });
  assert.equal(second.url, first.url);
  const applicant = await row("applicants", a.id);
  assert.equal(applicant.status, "round1_complete");
  assert.ok(applicant.round1_completed_at);
  assert.equal(applicant.identity_link, first.url);
  assert.equal(applicant.identity_status, "pending");
  assert.equal((await jobsFor(a.id)).filter((j) => j.payload.template === "identity").length, 1);
});

test("the worker delivers queued email with an idempotency key, backs off on failure, and parks bad requests", async () => {
  const a = await h.apply();
  const [job] = await jobsFor(a.id);
  await sql.query("update jobs set available_at = now() + interval '1 hour' where id <> $1 and status = 'pending'", [job.id]);
  let calls = 0;
  h.state.deliver = async () => { calls++; return { ok: false, error: "resend 503: down", retryable: true }; };
  const first = await h.cron();
  assert.equal(first.body.ok, true);
  let after = await row("jobs", job.id);
  assert.equal(after.status, "pending");
  assert.equal(after.attempts, 1);
  assert.ok(after.available_at > new Date(), "retry is scheduled in the future");
  assert.match(after.last_error, /503/);

  // Not due yet, so a second tick leaves it alone.
  await h.cron();
  assert.equal((await row("jobs", job.id)).attempts, 1);

  await sql.query("update jobs set available_at = now() where id = $1", [job.id]);
  h.state.deliver = async () => ({ ok: false, error: "resend 422: bad address", retryable: false });
  await h.cron();
  after = await row("jobs", job.id);
  assert.equal(after.status, "failed");

  // Ops can requeue; a successful delivery records the provider id.
  const retried = await h.ops({ action: "retry_job", jobId: job.id });
  assert.equal(retried.status, 200);
  h.state.deliver = async (input, key) => ({ ok: true, id: `re_${key}` });
  await h.cron();
  after = await row("jobs", job.id);
  assert.equal(after.status, "done");
  assert.equal(after.provider_id, `re_${job.dedupe_key}`);
  assert.equal(after.delivery_status, "accepted");
  assert.equal(calls, 1);
});

test("a VideoAsk webhook without stage infers round 1 from submitted", async () => {
  const a = await h.apply();
  const res = await h.videoask("", a.id, { event_id: "evt-no-stage" });
  assert.equal(res.body.advanced, true);
  assert.equal(res.body.status, "round1_complete");
});

test("webhook deliveries are recorded once and replays are answered without reprocessing", async () => {
  const a = await h.apply();
  const first = await h.videoask("round1", a.id, { event_id: "evt-1" });
  assert.equal(first.body.advanced, true);
  assert.equal(first.body.status, "round1_complete");
  const replay = await h.videoask("round1", a.id, { event_id: "evt-1" });
  assert.equal(replay.body.duplicate, true);
  assert.equal(await count("webhook_events", "provider = 'videoask' and event_key = 'round1:evt-1'"), 1);
  assert.equal(await count("application_events", "applicant_id = $1 and to_status = 'round1_complete'", [a.id]), 1);
  // Round 1 done: identity provisioning is queued for the worker.
  const queued = (await jobsFor(a.id)).find((j) => j.kind === "identity_session");
  assert.ok(queued);
  await h.cron();
  const applicant = await row("applicants", a.id);
  assert.match(applicant.identity_link, /^https:\/\/identity\.invalid\//);
  assert.equal((await row("jobs", queued.id)).status, "done");
});

for (const decision of ["approved", "declined"]) {
  for (const order of ["identity-first", "round1-first", "concurrent"]) {
    test(`${decision} converges when deliveries are ${order}`, async () => {
      const a = await h.apply();
      const identity = () => h.identity({ reference: a.id, decision, eventId: `${a.id}-${order}-id` });
      const round1 = () => h.videoask("round1", a.id, { event_id: `${a.id}-${order}-r1` });
      if (order === "identity-first") { await identity(); await round1(); }
      else if (order === "round1-first") { await round1(); await identity(); }
      else await Promise.all([identity(), round1()]);
      const expected = decision === "approved" ? "id_verified" : "id_failed";
      assert.equal((await row("applicants", a.id)).status, expected);
      await round1();
      await h.identity({ reference: a.id, decision, eventId: `${a.id}-${order}-id2` });
      const final = await row("applicants", a.id);
      assert.equal(final.status, expected);
      assert.equal(await count("application_events", "applicant_id = $1 and to_status = $2", [a.id, expected]), 1);
    });
  }
}

test("identity events for another session or from the past are ignored", async () => {
  const a = await h.apply();
  await h.videoask("round1", a.id);
  const { signSession } = h.load("lib/session.ts");
  await h.verify({ crp_session: signSession(a.id) });
  const { identity_session_id: session } = await row("applicants", a.id);

  const other = await h.identity({ reference: a.id, sessionId: "someone-elses-session", decision: "approved", eventId: "x1" });
  assert.equal(other.body.outcome, "session mismatch");
  assert.equal((await row("applicants", a.id)).status, "round1_complete");

  const newer = await h.identity({ reference: a.id, sessionId: session, decision: "declined", occurredAt: "2026-09-20T12:00:00Z", eventId: "x2" });
  assert.equal(newer.body.advanced, true);
  assert.equal((await row("applicants", a.id)).status, "id_failed");
  const older = await h.identity({ reference: a.id, sessionId: session, decision: "approved", occurredAt: "2026-09-20T11:00:00Z", eventId: "x3" });
  assert.equal(older.body.outcome, "stale");
  assert.equal((await row("applicants", a.id)).identity_status, "failed");
  // A genuinely newer approval still lifts a failed check.
  await h.identity({ reference: a.id, sessionId: session, decision: "approved", occurredAt: "2026-09-20T13:00:00Z", eventId: "x4" });
  assert.equal((await row("applicants", a.id)).status, "id_verified");
});

test("late identity and round1 events preserve onboarding", async () => {
  const a = await h.apply();
  await setStatus(a.id, "onboarding");
  await h.identity({ reference: a.id, decision: "approved", eventId: `${a.id}-late` });
  await h.videoask("round1", a.id);
  assert.equal((await row("applicants", a.id)).status, "onboarding");
});

test("round2 only advances an invited applicant", async () => {
  const a = await h.apply();
  await setStatus(a.id, "interview_yes");
  await h.videoask("round2", a.id);
  const done = await row("applicants", a.id);
  assert.equal(done.status, "docs_submitted");
  assert.equal(done.docs_status, "submitted");
  const b = await h.apply();
  await setStatus(b.id, "rejected");
  await h.videoask("round2", b.id);
  assert.equal((await row("applicants", b.id)).status, "rejected");
});

for (const status of ["docs_submitted", "onboarding", "online", "ineligible"]) {
  test(`decision polls preserve ${status} and queue no email`, async () => {
    const a = await h.apply();
    await setStatus(a.id, status);
    const before = (await jobsFor(a.id)).length;
    for (const d of [{ reviewDecision: "accept" }, { reviewDecision: "reject" }, { interviewOutcome: "yes" }, { interviewOutcome: "no" }]) {
      await h.decisions([{ applicantId: a.id, ...d }]);
    }
    assert.equal((await row("applicants", a.id)).status, status);
    assert.equal((await jobsFor(a.id)).length, before);
  });
}

test("a valid interview decision queues one email across repeated polls, and stale versions are refused", async () => {
  const a = await h.apply();
  await setStatus(a.id, "accepted");
  const { version } = await row("applicants", a.id);
  const first = await h.decisions([{ applicantId: a.id, decisionId: "22222222-2222-4222-8222-222222222222", version, interviewOutcome: "yes", reviewer: "Sam" }]);
  assert.equal(first.body.outcomes[0].result, "applied");
  const again = await h.decisions([{ applicantId: a.id, interviewOutcome: "yes" }]);
  assert.equal(again.body.outcomes[0].result, "unchanged");
  assert.equal((await row("applicants", a.id)).status, "interview_yes");
  assert.equal((await jobsFor(a.id)).filter((j) => j.payload.template === "decision:interview_yes").length, 1);

  // The sheet's old view of the row cannot undo the newer decision.
  const stale = await h.decisions([{ applicantId: a.id, version, interviewOutcome: "no" }]);
  assert.equal(stale.body.outcomes[0].result, "stale");
  assert.equal((await row("applicants", a.id)).status, "interview_yes");

  // A retried request replays the receipt rather than re-applying.
  const replay = await h.decisions([{ applicantId: a.id, decisionId: "22222222-2222-4222-8222-222222222222", interviewOutcome: "no" }]);
  assert.equal(replay.body.outcomes[0].result, "replayed");
  assert.equal((await row("applicants", a.id)).status, "interview_yes");
  const [event] = (await sql.query("select * from application_events where applicant_id = $1 and to_status = 'interview_yes'", [a.id])).rows;
  assert.equal(event.actor, "excel");
  assert.match(event.reason, /Sam/);
});

test("ops recovery writes the same completion columns as the webhooks", async () => {
  const a = await h.apply();
  const r1 = await h.ops({ action: "transition", applicantId: a.id, to: "round1_complete", reason: "form done" });
  assert.equal(r1.status, 200);
  const afterR1 = await row("applicants", a.id);
  assert.equal(afterR1.status, "round1_complete");
  assert.ok(afterR1.round1_completed_at);

  const id = await h.ops({ action: "transition", applicantId: a.id, to: "id_verified", reason: "manual verify" });
  assert.equal(id.status, 200);
  const afterId = await row("applicants", a.id);
  assert.equal(afterId.status, "id_verified");
  assert.equal(afterId.identity_status, "verified");

  await setStatus(a.id, "interview_yes");
  const docs = await h.ops({ action: "transition", applicantId: a.id, to: "docs_submitted", reason: "form done" });
  assert.equal(docs.status, 200);
  assert.equal((await row("applicants", a.id)).docs_status, "submitted");
});

test("the lifecycle refuses onboarding a traveller without a verified identity", async () => {
  const traveller = await h.apply({ track: "in_person" });
  await setStatus(traveller.id, "docs_submitted");
  const refused = await h.ops({ action: "transition", applicantId: traveller.id, to: "onboarding", reason: "docs approved" });
  assert.equal(refused.status, 409);
  assert.match(refused.body.detail, /identity_required/);
  await sql.query("update applicants set identity_status = 'verified' where id = $1", [traveller.id]);
  const allowed = await h.ops({ action: "transition", applicantId: traveller.id, to: "onboarding", reason: "docs approved" });
  assert.equal(allowed.status, 200);

  const online = await h.apply({ track: "online" });
  await setStatus(online.id, "docs_submitted");
  const ok = await h.ops({ action: "transition", applicantId: online.id, to: "onboarding", reason: "online cohort" });
  assert.equal(ok.status, 200);
  const skip = await h.ops({ action: "transition", applicantId: online.id, to: "submitted", reason: "nope" });
  assert.equal(skip.status, 409);
  const [event] = (await sql.query("select * from application_events where applicant_id = $1 and to_status = 'onboarding'", [online.id])).rows;
  assert.equal(event.actor, "ops");
  assert.match(event.reason, /tester/);
});

test("the sync feed pages by revision without gaps and by timestamp with a cursor", async () => {
  const ids = [];
  for (let i = 0; i < 3; i++) ids.push((await h.apply()).id);
  const all = await h.sync("applicants", "after=0&limit=500");
  const revisions = all.body.rows.map((r) => BigInt(r.revision));
  for (let i = 1; i < revisions.length; i++) assert.equal(revisions[i], revisions[i - 1] + 1n);
  const mine = all.body.rows.filter((r) => ids.includes(r.id));
  assert.equal(mine.length, 3);
  assert.equal("reviewDecision" in mine[0], false, "decision columns never leave the server");
  assert.equal(typeof mine[0].version, "number");

  const start = revisions[revisions.length - 4];
  const page1 = await h.sync("applicants", `after=${start}&limit=2`);
  assert.equal(page1.body.rows.length, 2);
  assert.equal(page1.body.hasMore, true);
  const page2 = await h.sync("applicants", `after=${page1.body.cursor}&limit=2`);
  assert.equal(page2.body.rows.length, 1);
  assert.equal(page2.body.hasMore, false);

  const byTime = await h.sync("applicants", "changedSince=1970-01-01T00:00:00Z&limit=2");
  assert.equal(byTime.body.rows.length, 2);
  assert.ok(byTime.body.next.afterId);
  const seen = new Set(byTime.body.rows.map((r) => r.id));
  let next = byTime.body.next;
  while (next) {
    const page = await h.sync("applicants", `changedSince=${next.changedSince}&afterId=${next.afterId}&limit=2`);
    for (const r of page.body.rows) { assert.equal(seen.has(r.id), false); seen.add(r.id); }
    next = page.body.hasMore ? page.body.next : null;
  }
  assert.equal(seen.size, await count("applicants"));
});

test("the ops overview surfaces failed emails and stuck identity checks", async () => {
  const a = await h.apply();
  await h.videoask("round1", a.id);
  await sql.query("update applicants set updated_at = now() - interval '2 hours' where id = $1", [a.id]);
  const [job] = await jobsFor(a.id);
  await sql.query("update jobs set status = 'failed', last_error = 'x' where id = $1", [job.id]);
  const view = await h.opsOverview();
  assert.ok(view.body.awaitingIdentity.some((r) => r.id === a.id));
  assert.ok(view.body.failedEmails.some((r) => r.id === job.id));
  assert.equal(typeof view.body.counts.submitted, "number");
});

test("submissions are rate limited per connection", async () => {
  const previousIp = h.state.ip;
  h.state.ip = "203.0.113.7";
  try {
    const results = [];
    for (let i = 0; i < 11; i++) results.push(await h.apply({ ip: "203.0.113.7" }));
    assert.equal(results.slice(0, 10).every((r) => r.ok), true);
    assert.deepEqual(results[10], { ok: false, reason: "rate_limited" });
  } finally {
    h.state.ip = previousIp;
  }
});

const GRAPH_KEYS = ["GRAPH_TENANT_ID", "GRAPH_CLIENT_ID", "GRAPH_CLIENT_SECRET", "GRAPH_DRIVE_ID", "GRAPH_ITEM_ID"];

test("excel cron skips when Graph is not configured", async () => {
  for (const key of GRAPH_KEYS) delete process.env[key];
  const res = await h.excel();
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true, skipped: true });
});

test("excel pull keeps reviewer cells when merging a system row", () => {
  const excel = h.load("lib/excel-rows.ts");
  const headers = excel.APPLICANT_COLUMNS;
  const existing = headers.map((name) => {
    if (name === "reviewDecision") return "accept";
    if (name === "decisionId") return "22222222-2222-4222-8222-222222222222";
    if (name === "reviewNotes") return "keep me";
    return "";
  });
  const merged = excel.mergeRow(headers, existing, {
    id: "11111111-1111-4111-8111-111111111111",
    status: "accepted",
    fullName: "Ada",
    skills: ["Agriculture & Food"],
    reviewDecision: "reject",
    decisionId: "33333333-3333-4333-8333-333333333333",
  }, excel.APPLICANT_SYSTEM);
  assert.equal(merged[headers.indexOf("reviewDecision")], "accept");
  assert.equal(merged[headers.indexOf("decisionId")], "22222222-2222-4222-8222-222222222222");
  assert.equal(merged[headers.indexOf("reviewNotes")], "keep me");
  assert.equal(merged[headers.indexOf("status")], "accepted");
  assert.equal(merged[headers.indexOf("fullName")], "Ada");
  assert.equal(merged[headers.indexOf("skills")], "[\"Agriculture & Food\"]");
  const blank = headers.map((name) => (name === "reviewDecision" ? "accept" : ""));
  assert.equal(excel.readApplicantDecision(headers, blank), null);
});

test("excel cron pulls an applicant, pushes one accept, and replays the same decision", async () => {
  for (const key of GRAPH_KEYS) delete process.env[key];
  process.env.GRAPH_TENANT_ID = "tenant";
  process.env.GRAPH_CLIENT_ID = "client";
  process.env.GRAPH_CLIENT_SECRET = "secret";
  process.env.GRAPH_DRIVE_ID = "drive";
  process.env.GRAPH_ITEM_ID = "item";

  const excel = h.load("lib/excel-rows.ts");
  const tables = {
    Applicants: excel.APPLICANT_COLUMNS,
    Waitlist: excel.WAITLIST_COLUMNS,
    Interest: excel.INTEREST_COLUMNS,
    Nominations: excel.NOMINATION_COLUMNS,
  };
  const book = {};
  for (const [name, headers] of Object.entries(tables)) {
    const row = headers.map(() => "");
    if (name === "Applicants") row[headers.indexOf("reviewDecision")] = "accept";
    book[name] = { headers, rows: [row] };
  }

  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    if (url.includes("oauth2/v2.0/token")) return json({ access_token: "tok", expires_in: 3600 });
    if (url.includes("/workbook/")) {
      const headers = new Headers(init?.headers);
      if (headers.get("authorization") !== "Bearer tok") throw new Error(`missing token ${url}`);
      if (!url.endsWith("/createSession") && headers.get("workbook-session-id") !== "sess") throw new Error(`missing session ${url}`);
    }
    if (url.endsWith("/createSession")) return json({ id: "sess" });
    if (url.endsWith("/closeSession")) return new Response(null, { status: 204 });
    const match = url.match(/\/tables\/([^/]+)\//);
    if (!match) return new Response(`not found ${url}`, { status: 404 });
    const table = decodeURIComponent(match[1]);
    const sheet = book[table];
    if (!sheet) return new Response(`missing table ${table}`, { status: 404 });
    const body = init?.body ? JSON.parse(init.body) : null;
    if (url.includes("/rows/add")) {
      sheet.rows.push(body.values[0]);
      return json({ index: sheet.rows.length - 1 });
    }
    if (url.includes("/itemAt(index=")) {
      const index = Number(url.match(/index=(\d+)/)[1]);
      sheet.rows[index] = body.values[0];
      return json({ index });
    }
    if (url.includes("/columns")) {
      return json({ value: sheet.headers.map((name, index) => ({ name, index })) });
    }
    if (url.includes("/rows")) {
      return json({ value: sheet.rows.map((values, index) => ({ index, values: [values] })) });
    }
    return new Response(`not found ${url}`, { status: 404 });
  };

  try {
    const max = await sql.query("select coalesce(max(revision), 0)::text as rev from sync_changes");
    for (const table of ["applicants", "waitlist", "interest", "nominations"]) {
      await sql.query(
        "insert into excel_cursors (table_name, cursor) values ($1, $2) on conflict (table_name) do update set cursor = excluded.cursor",
        [table, max.rows[0].rev],
      );
    }
    const applicant = await h.apply();
    const headers = book.Applicants.headers;
    const at = (name) => headers.indexOf(name);

    const applicantRow = () => book.Applicants.rows.find((values) => values[at("id")] === applicant.id);

    const pulled = await h.excel();
    assert.equal(pulled.status, 200, JSON.stringify(pulled.body));
    assert.equal(pulled.body.pushed.attempted, 0);
    assert.equal(book.Applicants.rows[0][at("id")], "");
    assert.equal(book.Applicants.rows[0][at("reviewDecision")], "accept");
    assert.equal(applicantRow()[at("fullName")], "Ada Lovelace");
    assert.equal(applicantRow()[at("status")], "submitted");
    assert.equal(applicantRow()[at("reviewDecision")], "");
    assert.equal(applicantRow()[at("skills")], "[\"Agriculture & Food\"]");

    applicantRow()[at("reviewDecision")] = "accept";
    applicantRow()[at("reviewNotes")] = "keep me";
    const pushed = await h.excel();
    assert.equal(pushed.status, 200, JSON.stringify(pushed.body));
    assert.equal(pushed.body.pushed.outcomes[0].result, "applied");
    assert.equal((await row("applicants", applicant.id)).status, "accepted");
    assert.equal(applicantRow()[at("reviewNotes")], "keep me");
    assert.equal(applicantRow()[at("reviewDecision")], "accept");
    assert.equal(applicantRow()[at("status")], "accepted");
    assert.match(String(applicantRow()[at("decisionId")]), /^[0-9a-f-]{36}$/i);

    const replayed = await h.excel();
    assert.equal(replayed.status, 200, JSON.stringify(replayed.body));
    assert.equal(replayed.body.pushed.outcomes[0].result, "replayed");
    assert.equal((await row("applicants", applicant.id)).status, "accepted");
    assert.equal(applicantRow()[at("reviewNotes")], "keep me");
    const receipts = await sql.query("select count(*)::int as n from decision_receipts where applicant_id = $1", [applicant.id]);
    assert.equal(receipts.rows[0].n, 1);
  } finally {
    globalThis.fetch = realFetch;
    for (const key of GRAPH_KEYS) delete process.env[key];
  }
});

test("all email templates escape untrusted names while preserving branded HTML", () => {
  const emails = loader()("lib/emails.ts");
  const name = '<a href="https://example.invalid">O\'Brien & Co</a>';
  const messages = [emails.nominationEmail(name)];
  for (const locale of ["en", "fr"]) messages.push(emails.applicationEmail(name, null, locale), emails.identityEmail(name, "https://example.invalid/verify", locale), emails.resumeEmail(name, "https://example.invalid/resume", locale));
  for (const { html } of messages) {
    assert.ok(!html.includes(name));
    assert.ok(html.includes("&lt;a href=&quot;https://example.invalid&quot;&gt;O&#39;Brien &amp; Co&lt;/a&gt;"));
    assert.ok(html.includes("<table"));
  }
});
