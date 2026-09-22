import { ContentGrid } from "@/components/ContentGrid";
import { Footer } from "@/components/Footer";
import { GetInvolved } from "@/components/GetInvolved";
import { GetInvolvedPill } from "@/components/GetInvolvedPill";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HeroExtension } from "@/components/HeroExtension";
import { PavilionPanel } from "@/components/PavilionPanel";
import { PlatformSection } from "@/components/PlatformSection";
import { Sponsors } from "@/components/Sponsors";
import { Waitlist } from "@/components/Waitlist";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col">
      <Header overMedia />
      <main className="flex-1">
        <Hero />
        <HeroExtension />
        <PavilionPanel />
        <PlatformSection />
        <ContentGrid />
        <GetInvolved />
        <Waitlist />
        <Sponsors />
      </main>
      <Footer />
      <GetInvolvedPill />
    </div>
  );
}
