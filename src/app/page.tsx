import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustSection } from "@/components/landing/trust-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SafetyHumanSection } from "@/components/landing/safety-human-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <TrustSection />
        <HowItWorksSection />
        <SafetyHumanSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
