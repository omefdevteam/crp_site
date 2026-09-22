import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Footer } from "@/components/Footer";
import { ProgramAbout } from "@/components/programs/ProgramAbout";
import { ProgramApplicationBand } from "@/components/programs/ProgramApplicationBand";
import { ProgramApplyBar } from "@/components/programs/ProgramApplyBar";
import { ProgramFaq } from "@/components/programs/ProgramFaq";
import { ProgramHero } from "@/components/programs/ProgramHero";
import { ProgramResonate } from "@/components/programs/ProgramResonate";
import { ProgramTestimonials } from "@/components/programs/ProgramTestimonials";
import { ProgramWhatYouGet } from "@/components/programs/ProgramWhatYouGet";
import { outfit } from "@/lib/fonts";
import { LOCALE_COOKIE, parseLocale } from "@/lib/locale";
import { copyFor } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const meta = copyFor(locale).meta.programs;
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string | string[] }>;
}) {
  const { intent } = await searchParams;
  const mode = intent === "nominate" ? "nominate" : "apply";

  return (
    <div className={`${outfit.className} relative flex flex-1 flex-col bg-cream`}>
      <main className="flex-1">
        <ProgramHero />

        {/* Centered 632px content column (632 + 2×24 gutter) */}
        <div className="mx-auto flex max-w-[680px] flex-col gap-16 px-6 pt-16 desk:gap-24 desk:pt-24">
          <ProgramAbout />
          <ProgramResonate />
          <ProgramWhatYouGet />
        </div>

        {/* Team cards bleed past the content column, matching Figma. */}
        <div className="pt-16 desk:pt-24">
          <ProgramTestimonials />
        </div>

        <div className="pt-20 desk:pt-32">
          <ProgramApplicationBand />
        </div>

        <ProgramFaq />
      </main>

      <Footer />
      {/* Reserve space so the fixed Apply bar never covers footer content */}
      <div className="h-[110px]" aria-hidden />

      <ProgramApplyBar mode={mode} />
    </div>
  );
}
