"use client";

import { motion, useInView } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

const SHOWN = { opacity: 1, y: 0, filter: "blur(0px)" };
// Instant, so a block hidden at hydration never animates out.
const HIDDEN = { opacity: 0, y: 28, filter: "blur(7px)", transition: { duration: 0 } };

/**
 * Fades a block in as it scrolls into view. The server HTML is always visible,
 * so first-screen text paints before JavaScript arrives. At hydration only
 * blocks still wholly below the viewport are hidden (the reader can't see them
 * yet) and then revealed on scroll; anything already on screen stays put.
 */
export function SectionReveal({
  children,
  className,
  delay = 0,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [belowFold, setBelowFold] = useState(false);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top >= window.innerHeight) setBelowFold(true);
  }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={belowFold ? (inView ? SHOWN : HIDDEN) : undefined}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
