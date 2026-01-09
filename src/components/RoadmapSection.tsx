import { motion } from "framer-motion";
import { Cpu, Globe, Building } from "lucide-react";

const phases = [
  {
    icon: Cpu,
    phase: "Phase I",
    years: "2025–2027",
    title: "Regenerative Kernel",
    description: "RCI engine v1, ethical constitution, governance framework, initial sovereign pilots.",
    status: "active",
  },
  {
    icon: Globe,
    phase: "Phase II",
    years: "2027–2030",
    title: "Planetary Integration",
    description: "RCI-linked finance instruments, ocean and health modules, UN & IFI integration.",
    status: "upcoming",
  },
  {
    icon: Building,
    phase: "Phase III",
    years: "2030–2040",
    title: "Civilizational Scale",
    description: "Global regenerative ledger, sovereign bond benchmarks, cultural normalization.",
    status: "future",
  },
];

const RoadmapSection = () => {
  return (
    <section className="py-32 bg-card relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm text-primary font-medium uppercase tracking-widest mb-4 block">
            Execution Timeline
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Path to Civilizational Scale
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A 15-year roadmap from kernel to planetary infrastructure.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-border" />

            <div className="space-y-12">
              {phases.map((phase, index) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative pl-20"
                >
                  {/* Timeline node */}
                  <div className={`
                    absolute left-4 top-2 w-8 h-8 rounded-full border-2 flex items-center justify-center
                    ${phase.status === "active" 
                      ? "bg-primary border-primary shadow-glow" 
                      : "bg-secondary border-border"
                    }
                  `}>
                    <phase.icon className={`w-4 h-4 ${
                      phase.status === "active" ? "text-primary-foreground" : "text-muted-foreground"
                    }`} />
                  </div>

                  {/* Content card */}
                  <div className={`
                    p-6 rounded-xl border transition-all duration-300
                    ${phase.status === "active" 
                      ? "bg-primary/5 border-primary/30" 
                      : "bg-secondary/30 border-border/50 hover:border-border"
                    }
                  `}>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`
                        px-3 py-1 text-xs font-medium rounded-full
                        ${phase.status === "active" 
                          ? "bg-primary/20 text-primary" 
                          : "bg-secondary text-muted-foreground"
                        }
                      `}>
                        {phase.phase}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {phase.years}
                      </span>
                      {phase.status === "active" && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          In Progress
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                      {phase.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {phase.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
