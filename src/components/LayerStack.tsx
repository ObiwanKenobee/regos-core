import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  Shield, 
  Repeat, 
  Brain, 
  Layers, 
  TrendingUp, 
  BookOpen,
  Lock,
  ChevronDown,
  Zap,
  Globe,
  Leaf,
  Users,
  Database,
  FileCheck
} from "lucide-react";

interface LayerDetail {
  title: string;
  description: string;
  icon: React.ElementType;
}

interface Layer {
  number: number;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  iconColor: string;
  details: LayerDetail[];
  capabilities: string[];
}

const layers: Layer[] = [
  {
    number: 0,
    name: "Ontological & Ethical Substrate",
    description: "Values constitution, ethical constraints, non-extraction rules",
    icon: Lock,
    color: "from-amber-warm/20 to-amber-warm/5",
    borderColor: "border-amber-warm/30",
    iconColor: "text-amber-warm",
    details: [
      { title: "Values Constitution", description: "Immutable ethical principles encoded into the system foundation", icon: FileCheck },
      { title: "Non-Extraction Rules", description: "Hard constraints preventing extractive behaviors and exploitation", icon: Shield },
      { title: "Ontological Mapping", description: "Formal definitions of regenerative concepts and relationships", icon: Database },
    ],
    capabilities: ["Immutable value anchoring", "Ethical constraint enforcement", "Foundational truth preservation"],
  },
  {
    number: 1,
    name: "Ethical Governance & Sovereignty",
    description: "Plural governance, moral AI protocols, values engine",
    icon: Shield,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
    details: [
      { title: "Plural Governance", description: "Multi-stakeholder decision frameworks respecting diverse sovereignties", icon: Users },
      { title: "Moral AI Protocols", description: "AI systems constrained by ethical boundaries and transparency requirements", icon: Brain },
      { title: "Values Engine", description: "Dynamic alignment of actions with regenerative principles", icon: Zap },
    ],
    capabilities: ["Distributed governance", "Ethical AI oversight", "Sovereignty protection"],
  },
  {
    number: 2,
    name: "Regenerative Value Exchange",
    description: "Capacity-clearing mechanism, living smart contracts",
    icon: Repeat,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
    details: [
      { title: "Capacity Clearing", description: "Real-time matching of regenerative capacity with demand", icon: TrendingUp },
      { title: "Living Contracts", description: "Adaptive smart contracts that evolve with ecosystem conditions", icon: FileCheck },
      { title: "Value Flow Tracking", description: "Transparent tracking of regenerative value through the system", icon: Repeat },
    ],
    capabilities: ["Capacity-backed transactions", "Adaptive contracts", "Value flow transparency"],
  },
  {
    number: 3,
    name: "Regenerative Intelligence (RCI Core)",
    description: "National/biome RCI, trajectory analysis, early-warning signals",
    icon: Brain,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
    details: [
      { title: "RCI Computation", description: "Multi-dimensional regenerative capacity index calculation", icon: Database },
      { title: "Trajectory Analysis", description: "Predictive modeling of regenerative capacity trends", icon: TrendingUp },
      { title: "Early Warning System", description: "Proactive alerts for capacity degradation risks", icon: Zap },
    ],
    capabilities: ["Real-time RCI scoring", "Predictive analytics", "Risk early-warning"],
  },
  {
    number: 4,
    name: "Sectoral Regenerative Modules",
    description: "Land, blue economy, human regeneration, circular bioeconomy",
    icon: Layers,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
    details: [
      { title: "Land Regeneration", description: "Soil health, biodiversity, and terrestrial ecosystem modules", icon: Leaf },
      { title: "Blue Economy", description: "Ocean health, marine ecosystems, and coastal resilience", icon: Globe },
      { title: "Human Regeneration", description: "Health, education, and community wellbeing metrics", icon: Users },
      { title: "Circular Bioeconomy", description: "Waste-to-value, biomaterials, and circular flows", icon: Repeat },
    ],
    capabilities: ["Multi-sector tracking", "Cross-domain integration", "Holistic assessment"],
  },
  {
    number: 5,
    name: "Capital & Impact Economy",
    description: "RCI-linked bonds, regenerative infrastructure, blended finance",
    icon: TrendingUp,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
    details: [
      { title: "RCI-Linked Instruments", description: "Financial products tied to measurable regenerative outcomes", icon: TrendingUp },
      { title: "Regenerative Infrastructure", description: "Capital deployment for regenerative asset development", icon: Database },
      { title: "Blended Finance", description: "Public-private-philanthropic capital coordination", icon: Users },
    ],
    capabilities: ["Outcome-linked financing", "Impact verification", "Capital coordination"],
  },
  {
    number: 6,
    name: "Culture, Knowledge & Memory",
    description: "Impact archives, ethical AI library, narrative engine",
    icon: BookOpen,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
    details: [
      { title: "Impact Archives", description: "Permanent record of regenerative actions and outcomes", icon: Database },
      { title: "Ethical AI Library", description: "Curated AI models trained on regenerative principles", icon: Brain },
      { title: "Narrative Engine", description: "Story generation for communicating regenerative impact", icon: BookOpen },
    ],
    capabilities: ["Civilizational memory", "Knowledge preservation", "Impact storytelling"],
  },
];

const LayerStack = () => {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);

  const toggleLayer = (layerNumber: number) => {
    setExpandedLayer(expandedLayer === layerNumber ? null : layerNumber);
  };

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
            operating system for planetary regeneration. Click any layer to explore.
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
                onClick={() => toggleLayer(layer.number)}
                className={`
                  relative p-6 rounded-xl border ${layer.borderColor}
                  bg-gradient-to-r ${layer.color}
                  backdrop-blur-sm
                  hover:scale-[1.02] transition-all duration-300
                  group cursor-pointer
                  ${expandedLayer === layer.number ? 'ring-2 ring-primary/50' : ''}
                `}
              >
                {/* Layer number indicator */}
                <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center">
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

                  <div className="flex items-center gap-2">
                    {layer.number === 0 && (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-warm/20 text-amber-warm border border-amber-warm/30">
                        Immutable
                      </span>
                    )}
                    <motion.div
                      animate={{ rotate: expandedLayer === layer.number ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {expandedLayer === layer.number && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 pt-6 border-t border-border/50 ml-4">
                        {/* Details grid */}
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          {layer.details.map((detail, idx) => (
                            <motion.div
                              key={detail.title}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-4 rounded-lg bg-secondary/30 border border-border/30"
                            >
                              <div className={`p-2 rounded-md bg-secondary/50 ${layer.iconColor} w-fit mb-3`}>
                                <detail.icon className="w-4 h-4" />
                              </div>
                              <h4 className="font-medium text-foreground text-sm mb-1">
                                {detail.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {detail.description}
                              </p>
                            </motion.div>
                          ))}
                        </div>

                        {/* Capabilities */}
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground mr-2">Capabilities:</span>
                          {layer.capabilities.map((cap) => (
                            <span
                              key={cap}
                              className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
