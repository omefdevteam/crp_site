import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

// Load production TS with isolated service boundaries. No network or live DB.
export function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      const index = path.join(file, "index.ts");
      if (fs.existsSync(index)) file = index;
    }
    if (!fs.existsSync(file)) file += fs.existsSync(`${file}.ts`) ? ".ts" : ".tsx";
    if (cache.has(file)) return cache.get(file).exports;
    if (file.endsWith(".json")) return JSON.parse(fs.readFileSync(file, "utf8"));
    const mod = { exports: {} };
    cache.set(file, mod);
    const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      fileName: file,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const nativeRequire = createRequire(file);
    const requireModule = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith("@/")) return load(name.slice(2));
      if (name.startsWith(".")) return load(path.resolve(path.dirname(file), name));
      return nativeRequire(name);
    };
    new Function("require", "module", "exports", output)(requireModule, mod, mod.exports);
    return mod.exports;
  }
  return load;
}

export function hookHarness() {
  const slots = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], (value) => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useId: () => `test-${cursor++}`,
    useEffect: () => {},
    useLayoutEffect: () => {},
  };
  return { react, render(fn) { cursor = 0; return fn(); } };
}

export function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
