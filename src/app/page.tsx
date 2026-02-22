import Header from "@/components/layout/header";
import Hero from "@/components/landing/hero";
import NeuralLogic from "@/components/landing/neural-logic";
import CorePrinciples from "@/components/landing/core-principles";
import EngineModules from "@/components/landing/engine-modules";
import Promoters from "@/components/landing/promoters";
import InvestorAlpha from "@/components/landing/investor-alpha";
import Footer from "@/components/layout/footer";
import FeaturesList from "@/components/landing/features-list";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <NeuralLogic />
        <FeaturesList />
        <CorePrinciples />
        <EngineModules />
        <Promoters />
        <InvestorAlpha />
      </main>
      <Footer />
    </div>
  );
}
