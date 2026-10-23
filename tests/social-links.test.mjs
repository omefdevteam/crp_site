import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import pg from "pg";
import { installDom } from "./dom.mjs";
import { loader } from "./helpers.mjs";
import { startDatabase } from "./db.mjs";

// Footer social links: one value for every language, edited in Website text.
// Storage runs on a throwaway Postgres migrated with the production SQL; no live DB.

installDom();
const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { createRoot } = await import("react-dom/client");
const { act } = React;

const nextMocks = {
  "next/cache": { unstable_cache: (fn) => fn, updateTag: () => {} },
  "next/headers": {
    headers: async () => new Headers(),
    cookies: async () => ({ get: () => undefined, set() {}, delete() {} }),
  },
  "next/navigation": {
    redirect: (url) => { throw new Error(`redirect ${url}`); },
    useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
    usePathname: () => "/admin/copy",
  },
  "next/link": {
    __esModule: true,
    default({ href, children, ...rest }) {
      return React.createElement("a", { href, ...rest }, children);
    },
  },
};

const load = loader(nextMocks);
const { checkSocialLink, socialHref, SOCIAL_KEYS, SOCIAL_LINK_MAX } = load("lib/copy/social.ts");
const catalog = load("lib/copy/catalog.ts");
const { locales } = load("lib/locale.ts");

let db;
let sql;

before(async () => {
  db = await startDatabase();
  process.env.DATABASE_URL = db.url;
  process.env.APP_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.NODE_ENV = "test";
  sql = new pg.Client({ connectionString: db.url });
  await sql.connect();
});

after(async () => {
  try { await load("lib/db/index.ts").closeDb(); } catch { /* pool may already be closed */ }
  try { await sql.end(); } catch { /* ignore */ }
  try { await db.stop(); } catch { /* ignore */ }
});

test("the link check accepts https addresses and allows empty", () => {
  assert.deepEqual(checkSocialLink(""), { ok: true, href: null });
  assert.deepEqual(checkSocialLink("   "), { ok: true, href: null });
  assert.deepEqual(checkSocialLink("https://www.instagram.com/climaterefugeepavilion"), { ok: true, href: "https://www.instagram.com/climaterefugeepavilion" });
  assert.deepEqual(checkSocialLink("  https://x.com/crp  "), { ok: true, href: "https://x.com/crp" });
  assert.deepEqual(checkSocialLink("HTTPS://WWW.LinkedIn.com/company/crp?ref=site#top"), { ok: true, href: "https://www.linkedin.com/company/crp?ref=site#top" });
  assert.equal(checkSocialLink("https://discord.gg/abc123").ok, true);
  assert.equal(checkSocialLink(`https://www.youtube.com/${"a".repeat(SOCIAL_LINK_MAX - 24)}`).ok, true);
});

test("the link check refuses http, javascript:, data:, overlong values and junk", () => {
  const refused = {
    "http://www.instagram.com/crp": "not-https",
    "javascript:alert(1)": "not-https",
    "JavaScript:alert(document.cookie)": "not-https",
    " javascript:alert(1)": "not-https",
    "data:text/html,<script>alert(1)</script>": "not-https",
    "vbscript:msgbox(1)": "not-https",
    "file:///etc/passwd": "not-https",
    "ftp://example.org/crp": "not-https",
    "mailto:hello@example.org": "not-https",
    "//www.instagram.com/crp": "not-https",
    "www.instagram.com/crp": "not-https",
    "instagram": "not-https",
    "/about": "not-https",
    "https://": "not-a-link",
    "https:// instagram.com": "not-a-link",
    "https://insta gram.com/crp": "not-a-link",
    "https://www.instagram.com/c\nrp": "not-a-link",
    "https://www.instagram.com/\u0000": "not-a-link",
    "https://user:pass@www.instagram.com/crp": "not-a-link",
    "https://localhost/crp": "not-a-link",
    "https://instagram./crp": "not-a-link",
    "https://[::1]/": "not-a-link",
    "https://exa mple.com": "not-a-link",
  };
  for (const [value, reason] of Object.entries(refused)) {
    assert.deepEqual(checkSocialLink(value), { ok: false, reason }, JSON.stringify(value));
    assert.equal(socialHref(value), null, JSON.stringify(value));
  }
  const long = `https://www.instagram.com/${"a".repeat(SOCIAL_LINK_MAX)}`;
  assert.deepEqual(checkSocialLink(long), { ok: false, reason: "too-long" });
  assert.deepEqual(checkSocialLink(" ".repeat(SOCIAL_LINK_MAX + 1)), { ok: false, reason: "too-long" });
  assert.equal(socialHref(undefined), null);
  assert.equal(socialHref(42), null);
});

test("social links are one English-only entry each, with plain labels and help", () => {
  const { copyLabel, copyHelp, sectionLabel } = load("lib/copy/labels.ts");
  assert.deepEqual([...catalog.CATALOGS.social.locales], ["en"]);
  assert.equal(catalog.CATALOGS.social.label, "Social links");
  assert.equal(catalog.isSingleValue("social"), true);
  for (const id of ["page", "ui", "ackEmail", "appEmail"]) assert.equal(catalog.isSingleValue(id), false, id);
  const leaves = catalog.leaves("social");
  assert.deepEqual(leaves.map((leaf) => leaf.key), [...SOCIAL_KEYS]);
  assert.deepEqual(leaves.map((leaf) => copyLabel("social", leaf.key)), ["Instagram link", "LinkedIn link", "X link", "YouTube link", "TikTok link", "Discord link"]);
  for (const leaf of leaves) {
    assert.equal(leaf.english, "");
    assert.equal(leaf.format, "link");
    assert.equal(sectionLabel(leaf.section), "Social links");
    assert.match(copyHelp("social", leaf.key), /https:\/\/.*every language.*empty to show the .* icon in the footer without a link/);
  }
  assert.equal(copyHelp("page", "hero.line1Accent"), null);
  assert.ok(catalog.parseCopyRef({ catalog: "social", locale: "en", key: "instagram" }));
  for (const locale of locales.filter((item) => item !== "en")) {
    assert.equal(catalog.parseCopyRef({ catalog: "social", locale, key: "instagram" }), null, locale);
  }
  assert.equal(catalog.parseCopyRef({ catalog: "social", locale: "en", key: "myspace" }), null);
});

test("saving checks the link and names the problem", () => {
  const ref = catalog.parseCopyRef({ catalog: "social", locale: "en", key: "youtube" });
  assert.deepEqual(catalog.checkValue(ref, ""), []);
  assert.deepEqual(catalog.checkValue(ref, "https://www.youtube.com/@crp"), []);
  assert.deepEqual(catalog.checkValue(ref, "https://www.youtube.com/{name}"), []);
  for (const bad of ["http://www.youtube.com/@crp", "javascript:alert(1)", "data:,x", "junk", `https://a.com/${"a".repeat(SOCIAL_LINK_MAX)}`]) {
    assert.deepEqual(catalog.checkValue(ref, bad), [{ kind: "link" }], bad);
  }
});

test("stored links need no migration, reach every locale, and bad stored values are dropped", async () => {
  const { saveDraft, publishCopy, loadDesk } = load("lib/copy/editor.ts");
  const { queryPublishedRows } = load("lib/copy/read.ts");
  const database = load("lib/db/index.ts").getDb();
  const user = await sql.query("insert into users (email, role) values ('editor@example.org', 'editor') returning id");
  const authorId = user.rows[0].id;
  const instagram = catalog.parseCopyRef({ catalog: "social", locale: "en", key: "instagram" });
  const tiktok = catalog.parseCopyRef({ catalog: "social", locale: "en", key: "tiktok" });

  assert.equal((await saveDraft(database, instagram, authorId, "javascript:alert(1)")).ok, false);
  assert.deepEqual(await saveDraft(database, instagram, authorId, "https://www.instagram.com/crp"), { ok: true });
  assert.deepEqual(await publishCopy(database, instagram, authorId, { kind: "draft" }, 0), { ok: true });
  const stored = await sql.query("select catalog, locale, key, value from copy_revisions where catalog = 'social'");
  assert.deepEqual(stored.rows, [{ catalog: "social", locale: "en", key: "instagram", value: "https://www.instagram.com/crp" }]);

  // A row written around the editor (or before a rule change) is never rendered.
  await sql.query("insert into copy_revisions (catalog, locale, key, revision, value, author_id) values ('social', 'en', 'tiktok', 1, 'javascript:alert(1)', $1)", [authorId]);
  const published = catalog.indexPublished(await queryPublishedRows(database));
  assert.deepEqual(catalog.socialLinks(published), { instagram: "https://www.instagram.com/crp" });
  assert.deepEqual(catalog.socialLinks(catalog.NO_OVERRIDES), {});
  assert.deepEqual(catalog.socialLinks(catalog.indexPublished([{ catalog: "social", locale: "en", key: "x", value: "data:,x" }])), {});

  // The editor shows one input (one "en" cell) per social link.
  const desk = await loadDesk(database, { catalog: "social", query: "", needsReview: false, authorId });
  assert.equal(desk.rows.length, 6);
  for (const row of desk.rows) {
    assert.deepEqual(row.cells.map((cell) => cell.locale), ["en"]);
    assert.ok(row.help);
  }
  const insta = desk.rows.find((row) => row.key === "instagram");
  assert.equal(insta.label, "Instagram link");
  assert.equal(insta.cells[0].value, "https://www.instagram.com/crp");
  assert.equal(desk.reviewCount, 0);
  assert.ok(tiktok);
});

function footerMarkup(social, locale = "en") {
  const { messages } = load("lib/messages.ts");
  const footerLoad = loader({
    ...nextMocks,
    "./LanguageProvider": {
      useCopy: () => messages[locale],
      useSocialLinks: () => social,
    },
    "./cookies/ConsentProvider": { useConsent: () => ({ openPreferences() {} }) },
    "./Logo": { Logo: () => React.createElement("span", null, "logo") },
    "@/components/LocaleLink": { __esModule: true, default: ({ href, children, ...rest }) => React.createElement("a", { href, ...rest }, children) },
    "@/lib/ui-text": { useText: () => (text) => text },
  });
  const { Footer } = footerLoad("components/Footer.tsx");
  return { html: renderToStaticMarkup(React.createElement(Footer)), getInTouch: messages[locale].footer.getInTouch };
}

test("the footer links only icons with a valid link, opening in a new tab, in every locale", () => {
  const social = {
    instagram: "https://www.instagram.com/crp",
    linkedin: "",
    x: "http://x.com/crp",
    youtube: "javascript:alert(1)",
    discord: "https://discord.gg/crp",
  };
  for (const locale of locales) {
    const { html, getInTouch } = footerMarkup(social, locale);
    const anchors = [...html.matchAll(/<a href="(https:[^"]*)"([^>]*)>/g)];
    assert.deepEqual(anchors.map((match) => match[1]), ["https://www.instagram.com/crp", "https://discord.gg/crp"], locale);
    for (const [, , attrs] of anchors) {
      assert.match(attrs, /target="_blank"/);
      assert.match(attrs, /rel="noopener noreferrer"/);
    }
    assert.match(html, /aria-label="Instagram"/);
    assert.match(html, /aria-label="Discord"/);
    // Networks without a valid link still show, as a plain tile that isn't a link.
    for (const plain of ["LinkedIn", "X", "YouTube", "TikTok"]) assert.match(html, new RegExp(`<span role="img" aria-label="${plain}"`), plain);
    for (const icon of ["linkedin", "x", "youtube", "tiktok"]) assert.match(html, new RegExp(`/icons/social/${icon}\\.svg`), icon);
    assert.doesNotMatch(html, /javascript:|http:\/\/x\.com/);
    assert.ok(html.includes(getInTouch), locale);
  }
});

test("the footer shows all six icons and Get in touch, without links, when none are set", () => {
  for (const social of [{}, { instagram: "", linkedin: "", x: "", youtube: "", tiktok: "", discord: " " }]) {
    for (const locale of locales) {
      const { html, getInTouch } = footerMarkup(social, locale);
      assert.ok(html.includes(getInTouch), locale);
      for (const key of SOCIAL_KEYS) assert.match(html, new RegExp(`/icons/social/${key}\\.svg`), key);
      assert.equal([...html.matchAll(/<span role="img" aria-label="/g)].length, 6, locale);
      assert.doesNotMatch(html, /target="_blank"/);
      assert.doesNotMatch(html, /<a href="https:/);
    }
  }

  const footer = loader(nextMocks)("components/Footer.tsx");
  assert.deepEqual(
    footer.footerSocials({ x: "https://x.com/crp", tiktok: " ", youtube: "http://youtube.com/crp" }).map((item) => [item.key, item.href]),
    [["instagram", null], ["linkedin", null], ["x", "https://x.com/crp"], ["youtube", null], ["tiktok", null], ["discord", null]],
  );
  const all = Object.fromEntries(SOCIAL_KEYS.map((key) => [key, `https://${key}.example.org/crp`]));
  assert.deepEqual(footer.footerSocials(all).map((item) => item.href), SOCIAL_KEYS.map((key) => `https://${key}.example.org/crp`));
});

test("the editor shows a social link as one labelled input with a help line", async () => {
  load("lib/copy/draftState.ts").clearCopyDrafts();
  const { CopyEditor } = load("components/admin/CopyEditor.tsx");
  const row = {
    catalog: "social",
    key: "instagram",
    label: "Instagram link",
    help: load("lib/copy/labels.ts").copyHelp("social", "instagram"),
    section: "social",
    sectionLabel: "Social links",
    english: "",
    digest: "digest",
    cells: [{ locale: "en", revision: 0, value: "", draft: null, override: false, state: { kind: "source" } }],
  };
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(React.createElement(CopyEditor, { row, scopeAll: false, query: "", needsReview: false }));
  });
  try {
    assert.equal(host.querySelectorAll("form").length, 1);
    assert.equal(host.querySelectorAll("textarea").length, 0);
    const input = host.querySelector('input[name="value"]');
    assert.ok(input);
    assert.equal(input.getAttribute("inputmode"), "url");
    assert.equal(host.querySelector(`label[for="${input.id}"]`).textContent, "Instagram link (all languages)");
    assert.equal(document.getElementById(input.getAttribute("aria-describedby")).textContent, row.help);
    assert.equal(host.querySelector('input[name="locale"]').value, "en");
    assert.equal(host.textContent.includes("English"), false);
    assert.equal(host.textContent.includes("Français"), false);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

test("the version history of a social link is headed for all languages; other sections keep the language", async () => {
  load("lib/copy/draftState.ts").clearCopyDrafts();
  const { historyLabel } = load("lib/copy/labels.ts");
  assert.equal(historyLabel("social", "English"), "All languages: earlier versions");
  for (const id of ["page", "ui", "ackEmail", "appEmail"]) assert.equal(historyLabel(id, "French"), "French: earlier versions", id);

  const { CopyDesk } = load("components/admin/CopyDesk.tsx");
  const head = (revision, value) => ({ revision, value, translatedFrom: null, createdAt: new Date("2026-10-23T09:00:00Z"), authorId: null, authorEmail: "editor@example.org", revertedFrom: null });
  const cellOf = (locale, value, kind) => ({ locale, revision: 2, value, draft: null, override: false, state: { kind } });
  const social = {
    catalog: "social", key: "instagram", label: "Instagram link", help: null, section: "social", sectionLabel: "Social links",
    english: "", digest: "d", cells: [cellOf("en", "https://www.instagram.com/b", "source")],
  };
  const page = {
    catalog: "page", key: "nav.about", label: "Menu: About", help: null, section: "nav", sectionLabel: "Top menu",
    english: "About", digest: "d", cells: [cellOf("en", "About", "source"), cellOf("fr", "À propos", "current")],
  };
  const summaries = async (row, history) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(React.createElement(CopyDesk, { catalog: row.catalog, scopeAll: false, query: "", needsReview: false, reviewCount: 0, rows: [row], selected: row, history }));
    });
    try {
      return [...host.querySelectorAll("details > summary")].map((node) => node.textContent).filter((text) => text.endsWith("earlier versions"));
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  };
  const socialHistory = await summaries(social, { en: [head(2, "https://www.instagram.com/b"), head(1, "https://www.instagram.com/a")] });
  assert.deepEqual(socialHistory, ["All languages: earlier versions"]);
  const pageHistory = await summaries(page, { en: [head(2, "About"), head(1, "About us")], fr: [head(2, "À propos"), head(1, "A propos")] });
  assert.deepEqual(pageHistory, ["English: earlier versions", "French: earlier versions"]);
});
