import { TopBar } from "@/components/TopBar";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { BuildingSection } from "@/components/BuildingSection";
import { MethodologySection } from "@/components/MethodologySection";
import { WaitlistSection } from "@/components/WaitlistSection";

export default function Home() {
  return (
    <>
      <TopBar />
      <main className="flex-1">
        <Hero />
        <ProblemSection />
        <BuildingSection />
        <MethodologySection />
        <WaitlistSection />
      </main>
    </>
  );
}
