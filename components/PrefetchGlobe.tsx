"use client";

import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import {
  GLOBE_PREFETCH_MARGIN,
  prefetchGlobe,
  whenNearViewport,
} from "./platform/globe-defer";

/**
 * Once the homepage platform section scrolls within a couple of screens,
 * warm the Three.js globe chunk + texture (on idle) so the globe can mount
 * from cache. Nothing three.js-related loads for visitors who never scroll there.
 */
export function PrefetchGlobe() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const section = document.getElementById("platform");
    if (!section) return;

    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    const warm = () => {
      if (!cancelled) prefetchGlobe();
    };

    const stopObserving = whenNearViewport(section, GLOBE_PREFETCH_MARGIN, () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(warm, { timeout: 1000 });
      } else {
        timeoutHandle = window.setTimeout(warm, 200);
      }
    });

    return () => {
      cancelled = true;
      stopObserving();
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, [reduceMotion]);

  return null;
}
