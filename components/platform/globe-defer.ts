export const GLOBE_DEFER_MS = 2500;

export const HOME_GLOBE_WAIT_IMAGES = [
  "/images/hero",
  "/images/pavilion-expo",
] as const;

export const ABOUT_GLOBE_WAIT_IMAGES = ["/images/about/hero/bg"] as const;

const GLOBE_WARM_URLS = [
  "/textures/earth-tinted.png",
  "/images/platform-globe-static.png",
] as const;

function imageSrcMatches(src: string, srcIncludes: string): boolean {
  if (src.includes(srcIncludes)) return true;
  try {
    const nested = new URL(src, window.location.origin).searchParams.get("url");
    if (nested && decodeURIComponent(nested).includes(srcIncludes)) return true;
  } catch {
    /* ignore invalid URLs */
  }
  return false;
}

export function waitForImage(srcIncludes: string): Promise<void> {
  return new Promise((resolve) => {
    const match = () =>
      Array.from(document.images).find(
        (img) =>
          imageSrcMatches(img.currentSrc, srcIncludes) ||
          imageSrcMatches(img.src, srcIncludes),
      );

    const existing = match();
    if (existing?.complete && existing.naturalWidth > 0) {
      resolve();
      return;
    }

    const onLoad = () => {
      const img = match();
      if (img?.complete && img.naturalWidth > 0) {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      document.removeEventListener("load", onLoad, true);
    };
    document.addEventListener("load", onLoad, true);

    const started = Date.now();
    const tick = () => {
      const img = match();
      if (img?.complete && img.naturalWidth > 0) {
        cleanup();
        resolve();
        return;
      }
      if (Date.now() - started > GLOBE_DEFER_MS) {
        cleanup();
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function waitForImages(srcIncludes: readonly string[]): Promise<void> {
  return Promise.all(srcIncludes.map(waitForImage)).then(() => undefined);
}

/** Pull the Three.js globe chunk + textures into cache without mounting a canvas. */
export function prefetchGlobe(): void {
  void import("./Globe");
  for (const src of GLOBE_WARM_URLS) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}
