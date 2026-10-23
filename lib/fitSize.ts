import type { CSSProperties } from "react";
import { FIT_ADVANCES, FIT_CHARS, FIT_KERN_TRAIL } from "./fitMetrics";

export type FitFont = keyof typeof FIT_ADVANCES;

const INDEX = new Map([...FIT_CHARS].map((char, i) => [char, i]));

let kernTrail: Map<string, number> | null = null;
function kerning(font: FitFont): Map<string, number> | null {
  if (font !== "trail") return null;
  kernTrail ??= new Map(
    FIT_KERN_TRAIL.trim()
      .split(" ")
      .map((entry) => {
        const [a, b, ...value] = [...entry];
        return [a + b, Number(value.join(""))] as const;
      }),
  );
  return kernTrail;
}

/**
 * The widest piece of `texts` that can't wrap (split at spaces and after
 * hyphens, or whole lines when `nowrap`), as its advance in em and its length
 * in characters (trail includes its capital kerning; Outfit has none, so it
 * errs a little small). With several texts it is the widest over all of them, so a
 * row of headings gets one shared size.
 */
export function widestRun(
  texts: string | readonly string[],
  font: FitFont,
  { upper = false, nowrap = false }: { upper?: boolean; nowrap?: boolean } = {},
): { em: number; n: number } {
  const advances = FIT_ADVANCES[font];
  const fallback = advances[INDEX.get(upper ? "N" : "n") ?? 0];
  const kern = kerning(font);
  let best = { em: 0, n: 0 };
  for (const text of typeof texts === "string" ? [texts] : texts) {
    const lines = (upper ? text.toUpperCase() : text).split("\n");
    const runs = nowrap
      ? lines
      : lines.flatMap((line) => line.split(/\s+/).flatMap((word) => word.match(/[^-]+-?|-/g) ?? []));
    for (const run of runs) {
      const chars = [...run];
      let width = 0;
      chars.forEach((char, i) => {
        width += advances[INDEX.get(char) ?? -1] ?? fallback;
        if (kern && i > 0) width += kern.get(chars[i - 1] + char) ?? 0;
      });
      if (width / 1000 > best.em) best = { em: width / 1000, n: chars.length };
    }
  }
  return best;
}

/**
 * Inline variables for the `fit-text` utility, which sizes a heading from the
 * first paint: min(design size, the size at which its widest run fills the
 * room). useFitText then only corrects for kerning after hydration, so slow
 * phones no longer paint the heading full size and snap it smaller later.
 * The element sets --fit-max, --fit-room and its tracking (--fit-track-px or
 * --fit-track-em) per breakpoint in its classes.
 */
export function fitVars(...args: Parameters<typeof widestRun>): CSSProperties {
  const { em, n } = widestRun(...args);
  return { "--fit-em": Math.max(em, 0.001).toFixed(4), "--fit-n": n } as CSSProperties;
}
