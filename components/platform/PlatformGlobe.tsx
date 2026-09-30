"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Pin, PinGroup } from "@/lib/pins";
import { GlobeShell } from "./GlobeShell";
import {
  GLOBE_DEFER_MS,
  HOME_GLOBE_WAIT_IMAGES,
  waitForImages,
} from "./globe-defer";

export type PlatformGlobeProps = {
  visibleGroups: readonly PinGroup[];
  emphasis: PinGroup | null;
  pins?: readonly Pin[];
  /** Image path fragments that must finish (or time out) before the live globe mounts. */
  waitForImages?: readonly string[];
};

function useGlobeReady(imageKeys: readonly string[]): boolean {
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const imageKey = imageKeys.join("\0");

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, GLOBE_DEFER_MS);

    waitForImages(imageKeys).then(() => {
      if (!cancelled) {
        window.clearTimeout(timeout);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [reduceMotion, imageKey, imageKeys]);

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

export function PlatformGlobe({
  visibleGroups,
  emphasis,
  pins,
  waitForImages: imageKeys = HOME_GLOBE_WAIT_IMAGES,
}: PlatformGlobeProps) {
  const ready = useGlobeReady(imageKeys);
  if (!ready) return <GlobeLoading />;
  return <Globe visibleGroups={visibleGroups} emphasis={emphasis} pins={pins} />;
}
