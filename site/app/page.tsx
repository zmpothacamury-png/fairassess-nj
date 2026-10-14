import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { BuildingSection } from "@/components/BuildingSection";
import { MethodologySection } from "@/components/MethodologySection";
import { WaitlistSection } from "@/components/WaitlistSection";
import { BalanceDivider } from "@/components/BalanceDivider";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <ProblemSection />
      <BalanceDivider />
      <BuildingSection />
      <MethodologySection />
      <BalanceDivider />
      <WaitlistSection />
    </main>
  );
}
