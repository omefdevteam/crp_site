import type { ReactNode } from "react";

// Outer frame shared by the globe and its placeholder so the two line up exactly.
export function GlobeShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative size-full">
      {/* Warm glow hugging the lower edge of the globe, fading upward. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-14%]"
        style={{
          background:
            "radial-gradient(52% 44% at 50% 88%, rgba(250,141,46,0.9) 0%, rgba(250,141,46,0.35) 38%, rgba(250,141,46,0) 68%)",
          filter: "blur(16px)",
        }}
      />
      {children}
    </div>
  );
}
