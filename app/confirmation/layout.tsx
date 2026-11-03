import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import "../globals.css";

// Root layout: per-request (dynamic) shell, see components/AppShell.tsx.
export const metadata: Metadata = { title: "Climate Refugee Pavilion", robots: { index: false, follow: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
