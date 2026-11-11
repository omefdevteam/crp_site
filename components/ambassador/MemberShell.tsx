import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { outfit } from "@/lib/fonts";

// The frame every Ambassador page shares: the site header and footer around a
// cream page, so the space reads as part of the public site.
export function MemberShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${outfit.className} relative flex flex-1 flex-col bg-cream`}>
      <div className="bg-black" data-nav-tone="dark">
        <Header />
        <div className="h-[104px] desk:h-[120px]" aria-hidden />
      </div>
      <main className="flex-1 px-4 py-10 desk:px-8 desk:py-16">{children}</main>
      <Footer pillSpace={false} />
    </div>
  );
}

// The wider white panel for the dashboard pages.
export function MemberPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[32px] bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)] desk:p-8 ${className}`}>{children}</section>;
}

export function MemberPage({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/60">Climate Refugee Pavilion</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight desk:text-4xl">{title}</h1>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function MemberCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
      <div className="gradient-brand h-2" aria-hidden />
      <div className="p-6 desk:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Climate Refugee Pavilion</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>
    </div>
  );
}
