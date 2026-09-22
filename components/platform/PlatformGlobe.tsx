"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { PinGroup } from "@/lib/pins";
import { GlobeShell } from "./GlobeShell";

export type PlatformGlobeProps = {
  visibleGroups: readonly PinGroup[];
  emphasis: PinGroup | null;
};

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
          priority
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

export function PlatformGlobe({ visibleGroups, emphasis }: PlatformGlobeProps) {
  return <Globe visibleGroups={visibleGroups} emphasis={emphasis} />;
}
