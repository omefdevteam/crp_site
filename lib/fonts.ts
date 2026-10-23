import { Geist, Outfit } from "next/font/google";

export const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Footer mobile (Figma): links and copyright are set in Geist.
export const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

/**
 * Trail display face. Declared by hand in app/globals.css (not next/font) so it
 * has one stable URL that the pages whose main heading is set in Trail can
 * preload (<TrailPreload />). With next/font a preloaded copy gets its own
 * hashed URL, so a per-page preload would download the font twice.
 * globals.css also holds the size-adjusted fallbacks that keep fitted titles
 * inside their edges until Trail arrives.
 */
export const trail = { className: "font-trail" } as const;

/** Public URL of the Trail file; keep in sync with app/globals.css and next.config.ts. */
export const TRAIL_SRC = "/TrailFree-p7ARD.otf";
