import { Outfit } from "next/font/google";
import localFont from "next/font/local";

export const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["200", "400", "500", "600", "700"],
});

export const trail = localFont({
  src: "../public/TrailFree-p7ARD.otf",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  // Only used below the fold, so skip the preload and its unused-preload warning.
  preload: false,
});
