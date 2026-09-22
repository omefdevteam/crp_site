"use client";

import { useId } from "react";
import { useCopy } from "../LanguageProvider";

const BUMPS = 16;
const CENTER = 100;
const BUMP_RING = 85;
const BUMP_R = 15;

const bumps = Array.from({ length: BUMPS }, (_, i) => {
  const a = (i / BUMPS) * Math.PI * 2;
  return {
    cx: CENTER + BUMP_RING * Math.cos(a),
    cy: CENTER + BUMP_RING * Math.sin(a),
  };
});

export function ComingSoonBadge({ className = "" }: { className?: string }) {
  const copy = useCopy();
  const uid = useId().replace(/:/g, "");
  const arcId = `${uid}-arc`;
  const heartId = `${uid}-heart`;
  return (
    <svg
      viewBox="0 0 200 200"
      width="124"
      height="124"
      className={`block h-auto ${className}`}
      aria-label={copy.platform.comingSoon}
    >
      <defs>
        <path
          id={arcId}
          d="M 40 100 A 60 60 0 0 0 160 100"
          fill="none"
        />
        <linearGradient id={heartId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c8b8ff" />
          <stop offset="45%" stopColor="#efe6ff" />
          <stop offset="100%" stopColor="#9fd7ff" />
        </linearGradient>
      </defs>

      <g fill="#0b0b0b">
        <circle cx={CENTER} cy={CENTER} r="82" />
        {bumps.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={BUMP_R} />
        ))}
      </g>

      <circle cx={CENTER} cy={CENTER} r="66" fill="none" stroke="#fff" strokeWidth="1.5" />

      <text
        fill="#fff"
        fontSize="15"
        fontWeight="600"
        letterSpacing="2.4"
        style={{ textTransform: "uppercase" }}
      >
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
          {copy.platform.comingSoon}
        </textPath>
      </text>

      <path
        d="M100 74c-4.6-8-18-7.2-18 3.4 0 7 8.8 13.4 18 20 9.2-6.6 18-13 18-20 0-10.6-13.4-11.4-18-3.4z"
        fill={`url(#${heartId})`}
        stroke="#fff"
        strokeWidth="1.2"
      />
    </svg>
  );
}
