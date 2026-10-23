import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { loader } from "./helpers.mjs";

const load = loader();
const emails = load("lib/emails.ts");
const { JSON_EMAILS } = load("lib/copy/sources.ts");
const copy = load("lib/translations/application-emails.json");

const LINK = "https://example.invalid/api/apply/confirm?token=abc";
const STEP_KEYS = ["confirmIntro", "expectHeading", "videoStep", "videoIntro", "videoTipQuiet", "videoTipLight", "videoTipDevice", "videoTipInternet", "identityStep", "identityIntro", "confirmClosing"];

function esc(value) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function at(html, text) {
  const index = html.indexOf(esc(text));
  assert.notEqual(index, -1, `missing: ${text}`);
  return index;
}

test("the confirmation email explains the video and identity steps in en, fr and es", () => {
  for (const language of ["en", "fr", "es"]) {
    const t = copy[language];
    const mail = emails.applicationEmail("Ada", LINK, language, JSON_EMAILS);
    assert.equal(mail.subject, t.applicationSubject);
    assert.match(mail.html, new RegExp(`<html lang="${language}"`));
    const greeting = at(mail.html, t.greeting.replace("{name}", "Ada"));
    const positions = STEP_KEYS.map((key) => at(mail.html, t[key]));
    const button = mail.html.indexOf('class="btn-link"');
    const ignore = at(mail.html, t.confirmIgnore);
    assert.ok(greeting < positions[0]);
    assert.deepEqual([...positions].sort((a, b) => a - b), positions, `${language} order`);
    assert.ok(positions.at(-1) < button && button < ignore, `${language} button sits between the closing and the note`);
    assert.ok(mail.html.includes(`href="${LINK}"`));
    assert.ok(mail.html.includes(`>${esc(t.confirmButton)}<`));
    assert.match(mail.html, new RegExp(`<strong style="font-weight:600">${esc(t.videoStep).replace(/[.()]/g, "\\$&")}</strong> `));
    assert.match(mail.html, new RegExp(`<strong style="font-weight:600">${esc(t.identityStep).replace(/[.()]/g, "\\$&")}</strong> `));
    assert.equal(mail.html.match(/&#8226;<\/td>/g)?.length, 4, `${language} has four tips`);
    assert.doesNotMatch(mail.html, /<(ul|li)[\s>]/);
    // The old one-paragraph message is gone.
    assert.equal(Object.hasOwn(t, "confirm"), false);
  }
});

test("the english confirmation email uses the approved wording", () => {
  const html = emails.applicationEmail("Ada", LINK, "en", JSON_EMAILS).html;
  for (const line of [
    "Thank you for applying to the Climate Refugee Pavilion. Please confirm your email address with the button below to start the next step. The link expires in 30 minutes, so get everything ready before you click it.",
    "What to expect",
    "1. Video questions (about 30 minutes).",
    "Some questions ask you to answer on video. Before you start:",
    "Find a quiet place with little background noise.",
    "Sit somewhere well lit, facing the light rather than with it behind you.",
    "Use a phone or computer with a working camera and microphone.",
    "Make sure your internet connection is stable.",
    "2. Identity check (about 2 minutes).",
    "Have a valid passport or national ID card with you. You'll take a photo of it and a quick selfie to verify your identity.",
    "Once both steps are done, your application goes to our team for review. You only need to complete it once, and we'll email you with an update after the review.",
    "If you did not apply, you can ignore this email.",
  ]) at(html, line);
  assert.equal(emails.applicationEmail("Ada", LINK, "en", JSON_EMAILS).subject, "We got your application");
});

test("confirmation email text is escaped, including overrides and the name", () => {
  const sources = { ack: {}, app: { en: { videoTipQuiet: "<b>Quiet</b> & calm", videoStep: "Step <1>", confirmIgnore: "Not you?\nIgnore" } } };
  const html = emails.applicationEmail("<script>x</script>", LINK, "en", sources).html;
  assert.doesNotMatch(html, /<script>x|<b>Quiet/);
  assert.ok(html.includes("&lt;b&gt;Quiet&lt;/b&gt; &amp; calm"));
  assert.ok(html.includes('<strong style="font-weight:600">Step &lt;1&gt;</strong>'));
  assert.ok(html.includes("Not you?<br />Ignore"));
  assert.ok(html.includes("&lt;script&gt;x&lt;/script&gt;"));
});

// Fingerprints of every other email (and the no-link application email) as
// they were before the confirmation email gained headings and lists.
const GOLDEN = {
 "application-nolink-en": "2a59b6203298d9a6",
 "resume-en": "8a2ae2ae32683054",
 "identity-en": "3518ab90a4fa81c5",
 "retry-en": "960d1aaf4eea3c75",
 "received-en": "6e52dd5f45da7128",
 "decision-rejected-en": "42219a74e8e8997b",
 "decision-rejected-nolink-en": "42219a74e8e8997b",
 "decision-online_offered-en": "582031f06f420195",
 "decision-online_offered-nolink-en": "31aaf0e5dbc1f6c2",
 "decision-accepted-en": "5e8fcfd362e6a800",
 "decision-accepted-nolink-en": "f895c7cb3221e6f0",
 "decision-interview_yes-en": "7e89bf9335a30367",
 "decision-interview_yes-nolink-en": "7e89bf9335a30367",
 "application-nolink-fr": "67d3121f96ea320f",
 "resume-fr": "3b6a5951306960ef",
 "identity-fr": "ff7ed9cc3785706f",
 "retry-fr": "bac2e293f59e3ccd",
 "received-fr": "ed222e29d7d1f5eb",
 "decision-rejected-fr": "fe9a591ed688a0c4",
 "decision-rejected-nolink-fr": "fe9a591ed688a0c4",
 "decision-online_offered-fr": "9a2fab1da79f9327",
 "decision-online_offered-nolink-fr": "504d1dda607432f0",
 "decision-accepted-fr": "2b4422f5725e0936",
 "decision-accepted-nolink-fr": "e3cb7c8e8f80dafa",
 "decision-interview_yes-fr": "3c2d0d033ee07135",
 "decision-interview_yes-nolink-fr": "3c2d0d033ee07135",
 "application-nolink-es": "94f2b0238d47f592",
 "resume-es": "a94bbdd0ed42faa3",
 "identity-es": "b192335aefcb0dbb",
 "retry-es": "667fdb7951718938",
 "received-es": "b1de15fcd746cd91",
 "decision-rejected-es": "1ee941e679b2949e",
 "decision-rejected-nolink-es": "1ee941e679b2949e",
 "decision-online_offered-es": "8b0620dff79e8bb6",
 "decision-online_offered-nolink-es": "085149e0bd96e3ad",
 "decision-accepted-es": "f36546f03c21ef0a",
 "decision-accepted-nolink-es": "e62868cdde4b0bd5",
 "decision-interview_yes-es": "23856110f1dadd89",
 "decision-interview_yes-nolink-es": "23856110f1dadd89",
 "waitlist-en": "0686e0abbcfa2218",
 "interest-en": "61aaca2262354ee4",
 "nomination-en": "e3a88eac5932229e",
 "partner-en": "2b891aa846f9d137",
 "contact-en": "2448d7f7cbd10bcd",
 "waitlist-fr": "cf65000b0c914911",
 "interest-fr": "17181c91b75ea198",
 "nomination-fr": "26494c8d8f1c056c",
 "partner-fr": "c066c22657f83ed3",
 "contact-fr": "9d58b761fe6880f5",
 "waitlist-es": "29583fe9da0ceb4c",
 "interest-es": "b6da8bc241cb8ab3",
 "nomination-es": "487d0d0dc55cb16b",
 "partner-es": "631b352732666709",
 "contact-es": "c710b9dbb235191b",
 "waitlist-pt": "4eba51190c70d5e1",
 "interest-pt": "2486025379ec8416",
 "nomination-pt": "b9b3c1c0fc107ede",
 "partner-pt": "e25f831e2d53e4b9",
 "contact-pt": "c0974c08d6ea0d50",
 "staff": "1836f871a102d84a",
 "staff-editor": "b99cb76242d4c556"
};

function fingerprint(mail) {
  const site = (process.env.APP_URL ?? "https://www.climaterefugeepavilion.org").replace(/\/+$/, "");
  const html = mail.html.replaceAll(site, "SITE").replace(/© \d{4}/g, "© YEAR");
  return createHash("sha256").update(`${mail.subject}\n${html}`).digest("hex").slice(0, 16);
}

test("every other email renders exactly as before", () => {
  const e = emails;
  const L = "https://example.invalid/go";
  const out = {};
  for (const l of ["en", "fr", "es"]) {
    out[`application-nolink-${l}`] = e.applicationEmail("Ada <b>", null, l, JSON_EMAILS);
    out[`resume-${l}`] = e.resumeEmail("Ada", L, l, JSON_EMAILS);
    out[`identity-${l}`] = e.identityEmail("Ada", L, l, JSON_EMAILS);
    out[`retry-${l}`] = e.identityRetryEmail("Ada", L, l, JSON_EMAILS);
    out[`received-${l}`] = e.receivedEmail("Ada", l, JSON_EMAILS);
    for (const s of ["rejected", "online_offered", "accepted", "interview_yes"]) {
      out[`decision-${s}-${l}`] = e.decisionEmail(s, L, l, JSON_EMAILS);
      out[`decision-${s}-nolink-${l}`] = e.decisionEmail(s, null, l, JSON_EMAILS);
    }
  }
  for (const l of ["en", "fr", "es", "pt"]) {
    out[`waitlist-${l}`] = e.waitlistEmail(l, JSON_EMAILS);
    out[`interest-${l}`] = e.interestEmail(l, "Ada", JSON_EMAILS);
    out[`nomination-${l}`] = e.nominationEmail("Bo", l, "Ada", JSON_EMAILS);
    out[`partner-${l}`] = e.partnerEmail("Ada", l, JSON_EMAILS);
    out[`contact-${l}`] = e.contactEmail("Ada", l, JSON_EMAILS);
  }
  out.staff = e.staffSignInEmail(L, null);
  out["staff-editor"] = e.staffSignInEmail(L, "editor");
  const actual = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fingerprint(v)]));
  assert.deepEqual(actual, GOLDEN);
});
