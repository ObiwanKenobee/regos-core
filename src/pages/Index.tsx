import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LayerStack from "@/components/LayerStack";
import RCISection from "@/components/RCISection";
import RCIWorldMap from "@/components/RCIWorldMap";
import RCIMethodology from "@/components/RCIMethodology";
import PolicySimulator from "@/components/PolicySimulator";
import StakeholderSection from "@/components/StakeholderSection";
import RoadmapSection from "@/components/RoadmapSection";
import ImpactTokenFlow from "@/components/ImpactTokenFlow";
import Footer from "@/components/Footer";
import { ScrollAnimationWrapper } from "@/components/ScrollAnimationWrapper";

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacityProgress = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  return (
    <main ref={containerRef} className="min-h-screen bg-background relative">
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ y: backgroundY, opacity: opacityProgress }}
      >
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </motion.div>

      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        
        <ScrollAnimationWrapper variant="fadeUp">
          <div id="architecture"><LayerStack /></div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper variant="fadeUp">
          <div id="rci"><RCISection /></div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper variant="scaleUp">
          <div id="world-map"><RCIWorldMap /></div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper variant="fadeUp">
          <div id="methodology"><RCIMethodology /></div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper variant="fadeUp">
          <div id="simulator"><PolicySimulator /></div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper variant="scaleUp">
          <div id="token-flow"><ImpactTokenFlow /></div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper variant="slideLeft">
          <div id="stewards"><StakeholderSection /></div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper variant="fadeUp">
          <div id="roadmap"><RoadmapSection /></div>
        </ScrollAnimationWrapper>

        <Footer />
      </div>
    </main>
  );
};

export default Index;
