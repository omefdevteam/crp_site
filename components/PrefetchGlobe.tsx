"use client";

import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import {
  HOME_GLOBE_WAIT_IMAGES,
  prefetchGlobe,
  waitForImages,
} from "./platform/globe-defer";

/**
 * After the homepage above-the-fold photos settle, warm the Three.js globe
 * chunk so About (and the home platform section) can mount it from cache.
 */
export function PrefetchGlobe() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    const warm = () => {
      if (!cancelled) prefetchGlobe();
    };

    waitForImages(HOME_GLOBE_WAIT_IMAGES).then(() => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(warm, { timeout: 3000 });
      } else {
        timeoutHandle = window.setTimeout(warm, 500);
      }
    });

    return () => {
      cancelled = true;
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, [reduceMotion]);

  return null;
}
