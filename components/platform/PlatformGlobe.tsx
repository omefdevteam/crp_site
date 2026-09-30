"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Pin, PinGroup } from "@/lib/pins";
import { GlobeShell } from "./GlobeShell";

export type PlatformGlobeProps = {
  visibleGroups: readonly PinGroup[];
  emphasis: PinGroup | null;
  pins?: readonly Pin[];
};

const GLOBE_DEFER_MS = 2500;

function waitForImage(srcIncludes: string): Promise<void> {
  return new Promise((resolve) => {
    const match = () =>
      Array.from(document.images).find((img) => img.currentSrc.includes(srcIncludes) || img.src.includes(srcIncludes));

    const existing = match();
    if (existing?.complete) {
      resolve();
      return;
    }

    const onLoad = () => {
      const img = match();
      if (img?.complete) {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      document.removeEventListener("load", onLoad, true);
    };
    document.addEventListener("load", onLoad, true);

    // Poll briefly in case next/image swaps src after mount.
    const started = Date.now();
    const tick = () => {
      const img = match();
      if (img?.complete) {
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

function useGlobeReady(): boolean {
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, GLOBE_DEFER_MS);

    Promise.all([
      waitForImage("/images/hero"),
      waitForImage("/images/pavilion-expo"),
    ]).then(() => {
      if (!cancelled) {
        window.clearTimeout(timeout);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [reduceMotion]);

  return reduceMotion ? false : ready;
}

// Still image of the globe's first frame, so the swap to the live canvas is not noticeable.
function GlobeLoading() {
  return (
    <GlobeShell>
      <div className="absolute inset-[-16%]">
        <Image
          src="/images/platform-globe-static.png"
          alt=""
          aria-hidden
          fill
          sizes="(min-width: 900px) 631px, 300px"
          className="object-contain"
        />
      </div>
    </GlobeShell>
  );
}

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <GlobeLoading />,
});

export function PlatformGlobe({ visibleGroups, emphasis, pins }: PlatformGlobeProps) {
  const ready = useGlobeReady();
  if (!ready) return <GlobeLoading />;
  return <Globe visibleGroups={visibleGroups} emphasis={emphasis} pins={pins} />;
}
