import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness, loader, nodes } from "./helpers.mjs";

for (const componentName of ["Waitlist", "ExpressInterestPopup"]) {
  for (const failure of ["rejected", "exception"]) {
    test(`${componentName} waits for persistence and recovers from ${failure}`, async () => {
      const hooks = hookHarness();
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
      globalThis.document = { body: {} };
      try {
        const render = () => hooks.render(() => Component({ open: true, ageGroup: "15_18", onClose() {} }));
        const find = (tree, predicate) => nodes(tree).find(predicate);
        const success = (tree) => Boolean(find(tree, (n) => n.props?.role === "status" && n.props["aria-hidden"] !== true));
        let tree = render();
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
      }
    });
  }
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
