"use client";

import { preload } from "react-dom";
import { TRAIL_SRC } from "@/lib/fonts";

/**
 * Preloads Trail on routes whose first-screen heading is set in it (about,
 * partner, contact). Elsewhere Trail only appears below the fold, so it is
 * fetched on first use instead of competing with the hero. A client component
 * so the hint is written into the SSR <head> (a server-component preload()
 * only reaches the RSC payload, i.e. after JS loads).
 */
export function TrailPreload() {
  preload(TRAIL_SRC, { as: "font", type: "font/otf", crossOrigin: "anonymous" });
  return null;
}
