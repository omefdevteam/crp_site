"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Fast switches finish before the bar would show, so they stay silent.
const SHOW_AFTER_MS = 120;
// Never leave a bar stuck if a navigation is abandoned.
const GIVE_UP_MS = 10000;

/** True when a click on this anchor is a same-tab, same-site page change the App Router handles. */
function isClientNavigation(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, window.location.href);
  return url.origin === window.location.origin && url.pathname !== window.location.pathname;
}

type Nav = { from: string; shown: boolean } | null;

/**
 * Thin top progress bar for in-site link navigation. The current page stays on
 * screen until the next one is ready (no blank loading state); the bar only
 * appears when the switch takes longer than SHOW_AFTER_MS.
 */
export function NavProgress() {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const [nav, setNav] = useState<Nav>(null);
  const timers = useRef<number[]>([]);
  const arrived = nav !== null && pathname !== nav.from;

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || !isClientNavigation(event, anchor)) return;
      clear();
      setNav({ from: pathRef.current, shown: false });
      timers.current.push(
        window.setTimeout(() => setNav((n) => (n ? { ...n, shown: true } : n)), SHOW_AFTER_MS),
        window.setTimeout(() => setNav(null), GIVE_UP_MS),
      );
    };
    // Bubble phase on document: runs after React's handlers, so preventDefault (language switch) is seen.
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clear();
    };
  }, []);

  // The new page has rendered: let the bar finish, then reset.
  useEffect(() => {
    if (!arrived) return;
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [window.setTimeout(() => setNav(null), 400)];
  }, [arrived]);

  if (!nav?.shown) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <Bar arrived={arrived} />
    </div>
  );
}

/**
 * Plain CSS transitions (no framer-motion): this sits in the [lang] layout, so
 * anything it imports ships on every page.
 */
function Bar({ arrived }: { arrived: boolean }) {
  // Paint 0% first, then grow two frames later so the width transition runs.
  const [grow, setGrow] = useState(false);
  useEffect(() => {
    let id = window.requestAnimationFrame(() => {
      id = window.requestAnimationFrame(() => setGrow(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const style = arrived
    ? { width: "100%", opacity: 0, transition: "width 150ms ease-out, opacity 250ms ease-out 150ms" }
    : { width: grow ? "85%" : "0%", opacity: 1, transition: "width 6s cubic-bezier(0.1, 0.6, 0.2, 1)" };
  return <div className="h-full bg-lime shadow-[0_0_8px_rgba(0,0,0,0.25)]" style={style} />;
}
