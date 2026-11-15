import assert from "node:assert/strict";
import test from "node:test";
import { loader, nodes } from "./helpers.mjs";

const load = loader();
const { displayMiddots, MIDDOT, MIDDOT_CLASS } = load("lib/displayMiddots.tsx");

function textOf(tree) {
  if (tree == null) return "";
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (Array.isArray(tree)) return tree.map(textOf).join("");
  if (typeof tree === "object") return textOf(tree.props?.children);
  return "";
}

test("strings without a mid-dot are returned unchanged", () => {
  assert.equal(displayMiddots("Ambassador Program"), "Ambassador Program");
  assert.equal(displayMiddots(""), "");
});

test("each mid-dot is wrapped in a fallback-font span", () => {
  const source = `ambassadeur${MIDDOT}rice${MIDDOT}s`;
  const tree = displayMiddots(source);
  const spans = nodes(tree).filter((node) => node.type === "span");
  assert.equal(spans.length, 2);
  for (const span of spans) {
    assert.equal(span.props.children, MIDDOT);
    assert.equal(span.props.className, MIDDOT_CLASS);
    assert.match(span.props.className, /--font-outfit/);
  }
  assert.equal(textOf(tree), source);
});

test("the programs heading keeps its letters and mid-dots in order", () => {
  const source = "Programme des ambassadeur·rice·s";
  const tree = displayMiddots(source);
  assert.notEqual(tree, source);
  assert.equal(textOf(tree), source);
});
