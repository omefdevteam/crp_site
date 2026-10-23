"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import type { Pin, PinGroup } from "@/lib/pins";
import { GlobeShell } from "./GlobeShell";
import {
  GLOBE_DEFER_MS,
  GLOBE_NEAR_MARGIN,
  HOME_GLOBE_WAIT_IMAGES,
  waitForImages,
  whenNearViewport,
} from "./globe-defer";

export type PlatformGlobeProps = {
  visibleGroups: readonly PinGroup[];
  emphasis: PinGroup | null;
  pins?: readonly Pin[];
  /** Image path fragments that must finish (or time out) before the live globe mounts. */
  waitForImages?: readonly string[];
  /** Starting spin angle in radians (0 = default framing). */
  initialYaw?: number;
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

/** True once `ref` has come within GLOBE_NEAR_MARGIN of the viewport (latches). */
function useNearViewport(ref: RefObject<HTMLElement | null>): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    return whenNearViewport(el, GLOBE_NEAR_MARGIN, () => setNear(true));
  }, [ref, near]);

  return near;
}

function GlobeStatic({ hidden }: { hidden?: boolean }) {
  return (
    <div
      className="absolute inset-[-16%] transition-opacity duration-500 ease-out"
      style={{ opacity: hidden ? 0 : 1 }}
      aria-hidden={hidden ? true : undefined}
    >
      <Image
        src="/images/platform-globe-static.png"
        alt=""
        aria-hidden
        fill
        sizes="(min-width: 900px) 631px, 300px"
        className="object-contain"
      />
    </div>
  );
}

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => null,
});

export function PlatformGlobe({
  visibleGroups,
  emphasis,
  pins,
  waitForImages: imageKeys = HOME_GLOBE_WAIT_IMAGES,
  initialYaw,
}: PlatformGlobeProps) {
  // The static underlay renders immediately; the Three.js chunk + texture only
  // load once the globe's frame scrolls near (and the page's key images settle).
  const frameRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(frameRef);
  const deferReady = useGlobeReady(imageKeys) && near;
  const [live, setLive] = useState(false);

  // Reset when the globe un-defers (adjusting state during render, not in an effect).
  if (!deferReady && live) setLive(false);

  return (
    <GlobeShell>
      <div ref={frameRef} aria-hidden className="pointer-events-none absolute inset-0" />
      <GlobeStatic hidden={live} />
      {deferReady ? (
        <div
          className="absolute inset-0 transition-opacity duration-500 ease-out"
          style={{ opacity: live ? 1 : 0 }}
        >
          <Globe
            visibleGroups={visibleGroups}
            emphasis={emphasis}
            pins={pins}
            initialYaw={initialYaw}
            onReady={() => setLive(true)}
          />
        </div>
      ) : null}
    </GlobeShell>
  );
}
