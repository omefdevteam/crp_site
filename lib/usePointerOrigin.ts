"use client";

import { useReducedMotion, useSpring, type MotionValue } from "framer-motion";
import { useCallback } from "react";
import type { PointerEvent } from "react";

const SPRING = { stiffness: 80, damping: 22, mass: 0.7 };

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function usePointerOrigin({
  restX = 0.5,
  restY = 0.5,
}: {
  restX?: number;
  restY?: number;
} = {}): {
  x: MotionValue<number>;
  y: MotionValue<number>;
  active: MotionValue<number>;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
} {
  const reduce = useReducedMotion();
  const x = useSpring(restX, SPRING);
  const y = useSpring(restY, SPRING);
  const active = useSpring(0, SPRING);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (reduce === true) return;
      if (event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      x.set(clamp01((event.clientX - rect.left) / width));
      y.set(clamp01((event.clientY - rect.top) / height));
      active.set(1);
    },
    [active, reduce, x, y],
  );

  const onPointerLeave = useCallback(() => {
    x.set(restX);
    y.set(restY);
    active.set(0);
  }, [active, restX, restY, x, y]);

  return { x, y, active, onPointerMove, onPointerLeave };
}
