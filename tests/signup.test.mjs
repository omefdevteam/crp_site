import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness, loader, nodes } from "./helpers.mjs";

for (const componentName of ["ExpressInterestPopup"]) {
  for (const failure of ["rejected", "exception"]) {
    test(`${componentName} waits for persistence and recovers from ${failure}`, async () => {
      const hooks = hookHarness();
      // The harness never mounts, so run each effect once after the first
      // render: attach host refs, then flush. Waitlist only shows Turnstile
      // once an IntersectionObserver reports the form on screen.
      const pending = [];
      const ran = new Set();
      let effectIndex = 0;
      hooks.react.useEffect = (effect) => { const i = effectIndex++; if (!ran.has(i)) { ran.add(i); pending.push(effect); } };
      const mount = (tree) => {
        for (const n of nodes(tree)) if (n.props?.ref && typeof n.props.ref === "object" && !n.props.ref.current) n.props.ref.current = { focus() {}, blur() {}, contains: () => false, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }) };
        while (pending.length) pending.shift()();
      };
      const previousObserver = globalThis.IntersectionObserver;
      globalThis.IntersectionObserver = class { constructor(callback) { this.callback = callback; } observe() { this.callback([{ isIntersecting: true }]); } disconnect() {} };
      let resolveRequest;
      let succeed = false;
      const action = async () => {
        if (succeed) return { ok: true };
        await new Promise((resolve) => { resolveRequest = resolve; });
        if (failure === "exception") throw new Error("database unavailable");
        return { ok: false };
      };
      const Turnstile = () => null;
      const copy = new Proxy({}, { get: () => new Proxy({}, { get: (_, name) => String(name) }) });
      const load = loader({
        react: hooks.react,
        "react-dom": { createPortal: (tree) => tree },
        "next/image": () => null,
        "framer-motion": { useReducedMotion: () => true, motion: new Proxy({}, { get: (_, name) => String(name) }) },
        "@/lib/fonts": { trail: { className: "font" } },
        "@/lib/actions": { submitWaitlist: action, submitInterest: action },
        "./LanguageProvider": { useCopy: () => copy, useLanguage: () => ({ locale: "en" }) },
        "./Turnstile": { Turnstile, TURNSTILE_SITE_KEY: "test-site" },
      });
      const Component = load(`components/${componentName}.tsx`)[componentName];
      const previousDocument = globalThis.document;
      globalThis.document = { body: { style: {} }, addEventListener() {}, removeEventListener() {} };
      try {
        const render = () => { effectIndex = 0; return hooks.render(() => Component({ open: true, ageGroup: "15_18", onClose() {} })); };
        const find = (tree, predicate) => nodes(tree).find(predicate);
        const success = (tree) => Boolean(find(tree, (n) => n.props?.role === "status" && n.props["aria-hidden"] !== true));
        let tree = render();
        mount(tree);
        tree = render();
        find(tree, (n) => n.type === "input" && n.props.name === "email").props.onChange({ target: { value: "test@example.invalid" } });
        const name = find(tree, (n) => n.type === "input" && n.props.name === "name");
        if (name) name.props.onChange({ target: { value: "Applicant" } });
        find(tree, (n) => n.type === Turnstile).props.onToken("first-token");
        tree = render();
        const challengeKey = find(tree, (n) => n.type === Turnstile).key;
        const saving = find(tree, (n) => n.type === "form").props.onSubmit({ preventDefault() {} });
        tree = render();
        assert.equal(find(tree, (n) => n.type === "form").props["aria-busy"], true);
        assert.equal(success(tree), false);
        resolveRequest();
        await saving;
        tree = render();
        assert.equal(success(tree), false);
        assert.ok(find(tree, (n) => n.props?.role === "alert"));
        assert.notEqual(find(tree, (n) => n.type === Turnstile).key, challengeKey);
        assert.equal(find(tree, (n) => n.type === "input" && n.props.name === "email").props.value, "test@example.invalid");
        assert.equal(find(tree, (n) => n.props?.type === "submit").props.disabled, true);
        succeed = true;
        find(tree, (n) => n.type === Turnstile).props.onToken("fresh-token");
        tree = render();
        await find(tree, (n) => n.type === "form").props.onSubmit({ preventDefault() {} });
        tree = render();
        assert.equal(success(tree), true);
        assert.equal(Boolean(find(tree, (n) => n.props?.role === "alert")), false);
      } finally {
        if (previousDocument === undefined) delete globalThis.document;
        else globalThis.document = previousDocument;
        if (previousObserver === undefined) delete globalThis.IntersectionObserver;
        else globalThis.IntersectionObserver = previousObserver;
      }
    });
  }
}

for (const failure of ["rejected", "exception"]) {
  test(`WaitlistForm waits for persistence and recovers from ${failure}`, async () => {
    const hooks = hookHarness();
    hooks.react.useEffect = () => {};
    hooks.react.useLayoutEffect = () => {};
    let resolveRequest;
    let succeed = false;
    let sent;
    const action = async (input) => {
      sent = input;
      if (succeed) return { ok: true };
      await new Promise((resolve) => { resolveRequest = resolve; });
      if (failure === "exception") throw new Error("database unavailable");
      return { ok: false };
    };
    const Turnstile = () => null;
    const FormShell = () => null;
    const ContinueButton = () => null;
    const DateField = () => null;
    const copy = new Proxy({}, { get: () => new Proxy({}, { get: (_, name) => String(name) }) });
    const { WaitlistForm } = loader({
      react: hooks.react,
      "react-dom": { createPortal: (tree) => tree },
      "@/lib/ui-text": { useText: () => (text) => text },
      "@/lib/apply-skills": { APPLY_SKILLS: [] },
      "@/lib/actions": { submitWaitlist: action },
      "./apply/ContinueButton": { ContinueButton },
      "./apply/DateField": { DateField },
      "./apply/FormShell": { FormShell },
      "./apply/fieldStyles": {},
      "./LanguageProvider": { useCopy: () => copy, useLanguage: () => ({ locale: "en" }) },
      "./Turnstile": { Turnstile, TURNSTILE_SITE_KEY: "test-site" },
    })("components/WaitlistForm.tsx");
    const render = () => hooks.render(() => WaitlistForm({ onClose() {} }));
    const all = (tree) => [...nodes(tree), ...nodes(tree?.props?.footer)];
    const find = (tree, predicate) => all(tree).find(predicate);
    const field = (tree, name) => find(tree, (n) => n.props?.name === name);
    const join = (tree) => find(tree, (n) => n.type === ContinueButton);
    let tree = render();
    assert.equal(join(tree).props.disabled, true);
    field(tree, "name").props.onChange({ target: { value: "Ama" } });
    field(tree, "email").props.onChange({ target: { value: "test@example.invalid" } });
    field(tree, "subject").props.onChange({ target: { value: "Climate" } });
    find(tree, (n) => n.type === DateField).props.onChange("2000-01-01");
    tree = render();
    assert.equal(join(tree).props.disabled, true, "waits for the challenge");
    find(tree, (n) => n.type === Turnstile).props.onToken("first-token");
    tree = render();
    assert.equal(join(tree).props.disabled, false);
    const challengeKey = find(tree, (n) => n.type === Turnstile).key;
    const saving = find(tree, (n) => n.type === "form").props.onSubmit({ preventDefault() {} });
    tree = render();
    assert.equal(find(tree, (n) => n.type === "form").props["aria-busy"], true);
    assert.equal(sent.subject, "Climate");
    assert.equal(sent.dob, "2000-01-01");
    resolveRequest();
    await saving;
    tree = render();
    assert.equal(Boolean(find(tree, (n) => n.props?.role === "status")), false);
    assert.ok(find(tree, (n) => n.props?.role === "alert"));
    assert.notEqual(find(tree, (n) => n.type === Turnstile).key, challengeKey);
    assert.equal(field(tree, "email").props.value, "test@example.invalid");
    assert.equal(join(tree).props.disabled, true);
    succeed = true;
    find(tree, (n) => n.type === Turnstile).props.onToken("fresh-token");
    tree = render();
    await find(tree, (n) => n.type === "form").props.onSubmit({ preventDefault() {} });
    tree = render();
    assert.ok(find(tree, (n) => n.props?.role === "status"));
    assert.equal(Boolean(find(tree, (n) => n.props?.role === "alert")), false);
  });
}

test("rapid repeated submits dispatch only one request", async () => {
  const hooks = hookHarness();
  const { useCaptureSubmission } = loader({ react: hooks.react })("components/useCaptureSubmission.ts");
  let resolveRequest, calls = 0;
  const action = () => { calls++; return new Promise((resolve) => { resolveRequest = resolve; }); };
  const { submit } = hooks.render(useCaptureSubmission);
  const first = submit(action);
  await submit(action);
  assert.equal(calls, 1);
  resolveRequest({ ok: true });
  assert.equal(await first, true);
});

test("the application flow submits explicit consent after the terms are accepted", async () => {
  const hooks = hookHarness();
  const TermsStep = () => null;
  const SkillsStep = () => null;
  const AboutStep = () => null;
  let submitted;
  const { ApplyFlow } = loader({
    react: hooks.react,
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "@/lib/actions": { startApplication: async (input) => { submitted = input; return { ok: false, reason: "invalid" }; } },
    "../LanguageProvider": { useLanguage: () => ({ locale: "en" }) },
    "@/lib/ui-text": { useText: () => (text) => text },
    "./TermsStep": { TermsStep },
    "./SkillsStep": { SkillsStep },
    "./AboutStep": { AboutStep },
    "./RedirectingStep": { RedirectingStep: () => null },
  })("components/apply/ApplyFlow.tsx");
  const render = () => hooks.render(() => ApplyFlow({ onClose() {} }));
  let tree = render();
  assert.equal(tree.type, TermsStep);
  tree.props.onAccept();
  tree = render();
  assert.equal(tree.type, SkillsStep);
  tree.props.onContinue();
  tree = render();
  assert.equal(tree.type, AboutStep);
  await tree.props.onSubmit({ email: "applicant@example.invalid" });
  assert.equal(submitted.consent, true);
});
