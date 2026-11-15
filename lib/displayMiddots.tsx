import { Fragment, type ReactNode } from "react";

/** Middle dot (U+00B7) used in French inclusive forms such as "ambassadeur·rice·s". */
export const MIDDOT = "\u00B7";

/**
 * Trail, the display face, has no · glyph, so mid-dots vanish or render from
 * a mismatched fallback. This class paints each dot in the body sans (Outfit,
 * via --font-outfit, then a system sans) and sizes it to sit with uppercase
 * Trail: a slightly smaller, medium-weight mark, optically lowered, with
 * tracking reset so tight display letter-spacing cannot swallow it.
 */
export const MIDDOT_CLASS =
  "mx-[0.04em] inline-block translate-y-[-0.08em] font-medium leading-none tracking-normal [font-family:var(--font-outfit),ui-sans-serif,system-ui,sans-serif] [font-size:0.58em]";

/**
 * Return `text` as React nodes, wrapping each · in a fallback-font span.
 * Strings without a mid-dot are returned unchanged so this is safe on any
 * display-font heading (including those sized with fitVars / fit-text).
 */
export function displayMiddots(text: string): ReactNode {
  if (!text.includes(MIDDOT)) return text;
  const parts = text.split(MIDDOT);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 ? <span className={MIDDOT_CLASS}>{MIDDOT}</span> : null}
    </Fragment>
  ));
}
