import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Zap, 
  ArrowDown, 
  Lock, 
  Shield, 
  Repeat, 
  Brain, 
  Layers, 
  TrendingUp, 
  BookOpen,
  Coins,
  TreeDeciduous,
  Droplets,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Token {
  id: string;
  type: "land" | "ocean" | "health" | "circular";
  value: number;
  currentLayer: number;
  status: "pending" | "processing" | "verified" | "minted";
}

const tokenTypes = {
  land: { icon: TreeDeciduous, color: "text-green-400", bg: "bg-green-400/20", name: "Land Regeneration" },
  ocean: { icon: Droplets, color: "text-blue-400", bg: "bg-blue-400/20", name: "Blue Economy" },
  health: { icon: Activity, color: "text-rose-400", bg: "bg-rose-400/20", name: "Human Wellbeing" },
  circular: { icon: Repeat, color: "text-purple-400", bg: "bg-purple-400/20", name: "Circular Economy" },
};

const layerIcons = [Lock, Shield, Repeat, Brain, Layers, TrendingUp, BookOpen];
const layerNames = [
  "Ethical Substrate",
  "Governance",
  "Value Exchange",
  "RCI Core",
  "Sectoral Modules",
  "Capital Economy",
  "Memory Archive"
];

const ImpactTokenFlow = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [stats, setStats] = useState({
    land: 0,
    ocean: 0,
    health: 0,
    circular: 0,
  });

  const generateToken = (): Token => {
    const types = ["land", "ocean", "health", "circular"] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      value: Math.floor(Math.random() * 50) + 10,
      currentLayer: 0,
      status: "pending",
    };
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setTokens([]);
    setTotalMinted(0);
    setStats({ land: 0, ocean: 0, health: 0, circular: 0 });
  };

  const stopSimulation = () => {
    setIsSimulating(false);
  };

  // Token generation
  useEffect(() => {
    if (!isSimulating) return;
    
    const interval = setInterval(() => {
      setTokens(prev => {
        if (prev.length >= 12) return prev;
        return [...prev, generateToken()];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Token progression through layers
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTokens(prev => {
        return prev.map(token => {
          if (token.currentLayer >= 6) {
            if (token.status !== "minted") {
              setTotalMinted(m => m + token.value);
              setStats(s => ({ ...s, [token.type]: s[token.type] + token.value }));
              return { ...token, status: "minted" as const };
            }
            return token;
          }

          const newLayer = token.currentLayer + 1;
          let newStatus: Token["status"] = "processing";
          if (newLayer >= 6) newStatus = "verified";
          
          return { ...token, currentLayer: newLayer, status: newStatus };
        }).filter(token => token.status !== "minted" || Date.now() % 10 !== 0);
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Cleanup minted tokens
  useEffect(() => {
    const cleanup = setInterval(() => {
      setTokens(prev => prev.filter(t => t.status !== "minted"));
    }, 3000);
    return () => clearInterval(cleanup);
  }, []);

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm text-primary font-medium uppercase tracking-widest mb-4 block">
            Token Economics
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Impact Token Flow
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Watch regenerative credits flow through the 6-layer architecture—from 
            verified capacity to minted impact tokens.
          </p>
          
          <div className="flex justify-center gap-4">
            {!isSimulating ? (
              <Button onClick={startSimulation} className="gap-2">
                <Zap className="w-4 h-4" /> Start Simulation
              </Button>
            ) : (
              <Button onClick={stopSimulation} variant="outline" className="gap-2">
                Stop Simulation
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats bar */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <Coins className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">
                {totalMinted}
              </div>
              <div className="text-xs text-muted-foreground">Total Minted</div>
            </div>
            {Object.entries(tokenTypes).map(([key, { icon: Icon, color, name }]) => (
              <div key={key} className="p-4 rounded-xl bg-card border border-border text-center">
                <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
                <div className="text-2xl font-display font-bold text-foreground">
                  {stats[key as keyof typeof stats]}
                </div>
                <div className="text-xs text-muted-foreground">{name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Flow visualization */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Layer columns */}
            <div className="grid grid-cols-7 gap-2">
              {layerNames.map((name, idx) => {
                const LayerIcon = layerIcons[idx];
                return (
                  <div key={idx} className="text-center">
                    <div className="h-[400px] relative rounded-xl bg-card/30 border border-border/50 backdrop-blur-sm overflow-hidden">
                      {/* Layer header */}
                      <div className="p-3 border-b border-border/30 bg-secondary/30">
                        <LayerIcon className={`w-5 h-5 mx-auto mb-1 ${idx === 0 ? 'text-amber-warm' : 'text-primary'}`} />
                        <span className="text-[10px] text-muted-foreground font-medium leading-tight block">
                          {name}
                        </span>
                      </div>

                      {/* Tokens in this layer */}
                      <div className="p-2 space-y-2 relative">
                        {tokens
                          .filter(t => t.currentLayer === idx)
                          .map(token => {
                            const { icon: TokenIcon, color, bg } = tokenTypes[token.type];
                            return (
                              <motion.div
                                key={token.id}
                                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                                className={`p-2 rounded-lg ${bg} border border-white/10 flex flex-col items-center`}
                              >
                                <TokenIcon className={`w-4 h-4 ${color}`} />
                                <span className="text-[10px] text-foreground font-medium mt-1">
                                  {token.value}
                                </span>
                              </motion.div>
                            );
                          })}
                      </div>

                      {/* Flow indicator */}
                      {idx < 6 && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
                          <motion.div
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <ArrowDown className="w-4 h-4 text-primary/50" />
                          </motion.div>
                        </div>
                      )}

                      {/* Layer number */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                        <span className="text-xs font-display font-bold text-muted-foreground/50">
                          L{idx}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Minted tokens output */}
            <motion.div 
              className="mt-6 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30"
              animate={totalMinted > 0 ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-4">
                <Coins className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">
                    Impact Token Treasury
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verified regenerative credits ready for capital deployment
                  </p>
                </div>
                <div className="text-3xl font-display font-bold text-primary ml-auto">
                  {totalMinted.toLocaleString()} RCI
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Legend */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(tokenTypes).map(([key, { icon: Icon, color, name }]) => (
              <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/30 border border-border/50">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactTokenFlow;
