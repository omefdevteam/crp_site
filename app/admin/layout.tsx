import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Root layout: per-request (dynamic) shell, never cached; see components/AppShell.tsx.
  return (
    <AppShell>
      <div className="min-h-full bg-cream text-ink">{children}</div>
    </AppShell>
  );
}
