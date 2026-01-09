import { motion } from "framer-motion";
import { 
  Shield, 
  Repeat, 
  Brain, 
  Layers, 
  TrendingUp, 
  BookOpen,
  Lock
} from "lucide-react";

const layers = [
  {
    number: 0,
    name: "Ontological & Ethical Substrate",
    description: "Values constitution, ethical constraints, non-extraction rules",
    icon: Lock,
    color: "from-amber-warm/20 to-amber-warm/5",
    borderColor: "border-amber-warm/30",
    iconColor: "text-amber-warm",
  },
  {
    number: 1,
    name: "Ethical Governance & Sovereignty",
    description: "Plural governance, moral AI protocols, values engine",
    icon: Shield,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
  {
    number: 2,
    name: "Regenerative Value Exchange",
    description: "Capacity-clearing mechanism, living smart contracts",
    icon: Repeat,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
  {
    number: 3,
    name: "Regenerative Intelligence (RCI Core)",
    description: "National/biome RCI, trajectory analysis, early-warning signals",
    icon: Brain,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
  {
    number: 4,
    name: "Sectoral Regenerative Modules",
    description: "Land, blue economy, human regeneration, circular bioeconomy",
    icon: Layers,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
  {
    number: 5,
    name: "Capital & Impact Economy",
    description: "RCI-linked bonds, regenerative infrastructure, blended finance",
    icon: TrendingUp,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
  {
    number: 6,
    name: "Culture, Knowledge & Memory",
    description: "Impact archives, ethical AI library, narrative engine",
    icon: BookOpen,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
];

const LayerStack = () => {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-glow opacity-40" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm text-primary font-medium uppercase tracking-widest mb-4 block">
            System Architecture
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            The 6-Layer Stack
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From immutable ethical foundations to civilizational memory—a complete 
            operating system for planetary regeneration.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-4">
          {layers.map((layer, index) => (
            <motion.div
              key={layer.number}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div
                className={`
                  relative p-6 rounded-xl border ${layer.borderColor}
                  bg-gradient-to-r ${layer.color}
                  backdrop-blur-sm
                  hover:scale-[1.02] transition-all duration-300
                  group cursor-pointer
                `}
              >
                {/* Layer number indicator */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center">
                  <span className="text-xs font-display font-bold text-muted-foreground">
                    {layer.number}
                  </span>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  <div className={`p-3 rounded-lg bg-secondary/50 ${layer.iconColor}`}>
                    <layer.icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                      {layer.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {layer.description}
                    </p>
                  </div>

                  {layer.number === 0 && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-warm/20 text-amber-warm border border-amber-warm/30">
                      Immutable
                    </span>
                  )}
                </div>

                {/* Connection line to next layer */}
                {index < layers.length - 1 && (
                  <div className="absolute -bottom-4 left-0 w-px h-4 bg-gradient-to-b from-border to-transparent ml-[9px]" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LayerStack;
