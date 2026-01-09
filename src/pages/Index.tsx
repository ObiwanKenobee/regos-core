import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LayerStack from "@/components/LayerStack";
import RCISection from "@/components/RCISection";
import StakeholderSection from "@/components/StakeholderSection";
import RoadmapSection from "@/components/RoadmapSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div id="architecture">
        <LayerStack />
      </div>
      <div id="rci">
        <RCISection />
      </div>
      <div id="stewards">
        <StakeholderSection />
      </div>
      <div id="roadmap">
        <RoadmapSection />
      </div>
      <Footer />
    </main>
  );
};

export default Index;
