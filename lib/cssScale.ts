import { useEffect, useLayoutEffect } from "react";

/**
 * The popup cards scale their 536² Figma layout in CSS: container units give
 * the edge, and tan(atan2(edge, 536px)) turns it into the scale() number.
 * Browsers without CSS trig or container units (iOS 15, older Android
 * WebView) drop those declarations, so they fall back to measuring in JS.
 */
export const CSS_SCALE_FEATURES = [
  "width: calc(tan(atan2(1px, 1px)) * 1px)",
  "width: 1cqw",
  "container-type: inline-size",
] as const;

type CssSupports = { supports?: (condition: string) => boolean };

export function supportsCssScale(css?: CssSupports | null): boolean {
  if (!css || typeof css.supports !== "function") return false;
  try {
    return CSS_SCALE_FEATURES.every((feature) => css.supports!(feature));
  } catch {
    return false;
  }
}

function browserSupportsCssScale() {
  return supportsCssScale(typeof CSS === "undefined" ? null : CSS);
}

// Layout effects run after the DOM is in place but before the browser paints,
// so the fallback scale is applied on the same frame the card first appears.
// The server never runs either effect.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Fallback only: when the CSS path is unsupported, call `measure` before the
 * first paint and again whenever `target` resizes. `measure` writes the scale
 * straight onto the elements' inline styles. React leaves those alone, because
 * the CSS-path values it renders never change.
 */
export function useCssScaleFallback(
  getTarget: () => Element | null | undefined,
  measure: () => void,
) {
  useIsomorphicLayoutEffect(() => {
    if (browserSupportsCssScale()) return;
    const target = getTarget();
    if (!target) return;
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    return () => ro.disconnect();
    // getTarget/measure only read refs; run once per mount like the old observer.
  }, []);
}
