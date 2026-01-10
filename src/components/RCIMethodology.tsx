import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Satellite, 
  Database, 
  Cpu, 
  BarChart3, 
  ArrowRight, 
  Leaf, 
  Waves, 
  Heart, 
  Recycle,
  Play,
  Pause,
  RotateCcw,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  value?: number;
  category: "source" | "processor" | "output";
}

const dataNodes: DataNode[] = [
  // Sources
  { id: "satellite", label: "Satellite Data", icon: <Satellite />, description: "Remote sensing & land cover analysis", category: "source" },
  { id: "iot", label: "IoT Sensors", icon: <Database />, description: "Soil, water, ocean monitoring", category: "source" },
  { id: "health", label: "Health Systems", icon: <Heart />, description: "Public health & population data", category: "source" },
  { id: "supply", label: "Supply Chain", icon: <Recycle />, description: "Material flows & circular economy", category: "source" },
  // Processors
  { id: "land", label: "Land Capacity", icon: <Leaf />, value: 72.4, description: "Soil health, biodiversity, carbon", category: "processor" },
  { id: "ocean", label: "Ocean Capacity", icon: <Waves />, value: 68.9, description: "Marine health, fish stocks, pH", category: "processor" },
  { id: "human", label: "Human Capacity", icon: <Heart />, value: 71.2, description: "Health, education, productivity", category: "processor" },
  { id: "circular", label: "Circular Capacity", icon: <Recycle />, value: 64.8, description: "Waste, recycling, material loops", category: "processor" },
  // Output
  { id: "rci", label: "RCI Score", icon: <Zap />, value: 69.3, description: "Regenerative Capacity Index", category: "output" },
];

const connections = [
  { from: "satellite", to: "land" },
  { from: "satellite", to: "ocean" },
  { from: "iot", to: "land" },
  { from: "iot", to: "ocean" },
  { from: "health", to: "human" },
  { from: "supply", to: "circular" },
  { from: "land", to: "rci" },
  { from: "ocean", to: "rci" },
  { from: "human", to: "rci" },
  { from: "circular", to: "rci" },
];

const RCIMethodology = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeFlow, setActiveFlow] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<DataNode | null>(null);

  const runAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
      setActiveFlow([]);
      setStep(0);
      return;
    }

    setIsAnimating(true);
    setStep(0);

    // Step 1: Activate sources
    setTimeout(() => {
      setActiveFlow(["satellite", "iot", "health", "supply"]);
      setStep(1);
    }, 500);

    // Step 2: Data flows to processors
    setTimeout(() => {
      setActiveFlow(["satellite", "iot", "health", "supply", "land", "ocean", "human", "circular"]);
      setStep(2);
    }, 1500);

    // Step 3: Processors calculate and flow to RCI
    setTimeout(() => {
      setActiveFlow(["satellite", "iot", "health", "supply", "land", "ocean", "human", "circular", "rci"]);
      setStep(3);
    }, 2500);

    // Reset after full cycle
    setTimeout(() => {
      setIsAnimating(false);
    }, 4000);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setActiveFlow([]);
    setStep(0);
  };

  const getNodePosition = (id: string) => {
    const sourceNodes = dataNodes.filter(n => n.category === "source");
    const processorNodes = dataNodes.filter(n => n.category === "processor");
    
    if (dataNodes.find(n => n.id === id)?.category === "source") {
      const index = sourceNodes.findIndex(n => n.id === id);
      return { x: 80, y: 80 + index * 110 };
    } else if (dataNodes.find(n => n.id === id)?.category === "processor") {
      const index = processorNodes.findIndex(n => n.id === id);
      return { x: 350, y: 80 + index * 110 };
    } else {
      return { x: 620, y: 240 };
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-glow opacity-20" />

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Methodology Deep Dive</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            How
            <span className="text-gradient-primary"> RCI </span>
            is Calculated
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Interactive visualization of data flows from sources to the final Regenerative Capacity Index. 
            Click play to see how planetary data becomes actionable intelligence.
          </p>
        </motion.div>

        {/* Control Panel */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            onClick={runAnimation}
            variant={isAnimating ? "outline" : "default"}
            className="gap-2"
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAnimating ? "Pause" : "Run Calculation"}
          </Button>
          <Button onClick={resetAnimation} variant="ghost" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Data Sources", "Sector Processing", "RCI Aggregation", "Complete"].map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                step >= i + 1
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted/30 text-muted-foreground border border-transparent"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${step >= i + 1 ? "bg-primary" : "bg-muted-foreground"}`} />
              <span className="text-sm font-medium hidden md:inline">{label}</span>
              <span className="text-sm font-medium md:hidden">{i + 1}</span>
            </div>
          ))}
        </div>

        {/* Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 lg:p-10 overflow-hidden"
        >
          <div className="relative" style={{ minHeight: "520px" }}>
            {/* SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: "520px" }}>
              <defs>
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(165, 60%, 45%)" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="hsl(165, 60%, 45%)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(165, 60%, 45%)" stopOpacity="0.2" />
                </linearGradient>
                <filter id="flowGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {connections.map((conn, i) => {
                const fromPos = getNodePosition(conn.from);
                const toPos = getNodePosition(conn.to);
                const isActive = activeFlow.includes(conn.from) && activeFlow.includes(conn.to);
                
                return (
                  <motion.path
                    key={i}
                    d={`M ${fromPos.x + 100} ${fromPos.y + 35} C ${(fromPos.x + toPos.x) / 2 + 50} ${fromPos.y + 35}, ${(fromPos.x + toPos.x) / 2 + 50} ${toPos.y + 35}, ${toPos.x} ${toPos.y + 35}`}
                    fill="none"
                    stroke={isActive ? "url(#flowGradient)" : "hsl(220, 15%, 25%)"}
                    strokeWidth={isActive ? 3 : 1.5}
                    strokeDasharray={isActive ? "0" : "5,5"}
                    filter={isActive ? "url(#flowGlow)" : undefined}
                    initial={{ pathLength: 0, opacity: 0.3 }}
                    animate={{ 
                      pathLength: 1, 
                      opacity: isActive ? 1 : 0.3,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                );
              })}
            </svg>

            {/* Data Nodes */}
            {dataNodes.map((node) => {
              const pos = getNodePosition(node.id);
              const isActive = activeFlow.includes(node.id);
              
              return (
                <motion.div
                  key={node.id}
                  className={`absolute w-48 transition-all cursor-pointer ${
                    isActive ? "z-10" : "z-0"
                  }`}
                  style={{ left: pos.x, top: pos.y }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary shadow-glow"
                        : "bg-card/80 border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {node.icon}
                      </div>
                      <span className="font-medium text-sm">{node.label}</span>
                    </div>
                    
                    {node.value !== undefined && (
                      <motion.div
                        className="text-2xl font-bold text-gradient-primary"
                        animate={{ 
                          opacity: isActive ? 1 : 0.6,
                        }}
                      >
                        {node.value}
                        {node.category === "output" && (
                          <span className="text-xs text-muted-foreground font-normal ml-1">/ 100</span>
                        )}
                      </motion.div>
                    )}
                    
                    {node.category === "source" && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                        <span className="text-xs text-muted-foreground">
                          {isActive ? "Streaming" : "Waiting"}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Column Labels */}
            <div className="absolute top-0 left-12 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Data Sources
            </div>
            <div className="absolute top-0 left-[320px] text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sector Processing
            </div>
            <div className="absolute top-0 left-[580px] text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Aggregated Output
            </div>
          </div>
        </motion.div>

        {/* Node Detail Tooltip */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 glass rounded-xl px-6 py-4 z-50 max-w-md"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  {hoveredNode.icon}
                </div>
                <div>
                  <div className="font-semibold">{hoveredNode.label}</div>
                  <div className="text-xs text-muted-foreground capitalize">{hoveredNode.category}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{hoveredNode.description}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Methodology Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              title: "Data Integration",
              icon: <Database className="w-5 h-5" />,
              description: "Real-time streams from satellites, IoT sensors, public health systems, and supply chain databases feed into the RCI engine.",
            },
            {
              title: "Sector Processing",
              icon: <Cpu className="w-5 h-5" />,
              description: "AI models calculate capacity scores for Land, Ocean, Human, and Circular systems using validated scientific methodologies.",
            },
            {
              title: "Index Aggregation",
              icon: <BarChart3 className="w-5 h-5" />,
              description: "Weighted aggregation produces the final RCI score, incorporating trend analysis and forward-looking projections.",
            },
          ].map((item, i) => (
            <div key={i} className="glass rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                {item.icon}
              </div>
              <h3 className="font-display font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default RCIMethodology;
