export const GLOBE_DEFER_MS = 2500;

export const HOME_GLOBE_WAIT_IMAGES = [
  "/images/hero",
  "/images/pavilion-expo",
] as const;

export const ABOUT_GLOBE_WAIT_IMAGES = ["/images/about/hero/bg"] as const;

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

/**
 * Pull the Three.js globe chunk + earth texture into cache without mounting a
 * canvas. The texture goes through drei's loader cache (see
 * preloadGlobeTexture) so the mounted globe reuses it instead of refetching.
 * The static underlay is served by next/image, so there is nothing to warm.
 */
export function prefetchGlobe(): void {
  void import("./Globe")
    .then((mod) => mod.preloadGlobeTexture())
    .catch(() => {
      /* the globe retries on mount */
    });
}

/** Load the live globe once its frame is within this distance of the viewport. */
export const GLOBE_NEAR_MARGIN = "50% 0px";
/** Start warming the chunk + texture a little earlier than that. */
export const GLOBE_PREFETCH_MARGIN = "100% 0px";

/** Resolve once `el` comes within `rootMargin` of the viewport. Returns a disposer. */
export function whenNearViewport(
  el: Element,
  rootMargin: string,
  onNear: () => void,
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onNear();
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        io.disconnect();
        onNear();
      }
    },
    { rootMargin },
  );
  io.observe(el);
  return () => io.disconnect();
}
