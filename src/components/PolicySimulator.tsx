import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Leaf,
  Waves,
  Heart,
  Recycle,
  Play,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface SimulationParams {
  landInvestment: number;
  oceanProtection: number;
  healthcareSpending: number;
  circularEconomyPolicy: number;
  carbonTax: number;
  renewableTarget: number;
}

interface SimulationResult {
  year: number;
  rci: number;
  land: number;
  ocean: number;
  human: number;
  circular: number;
  baseline: number;
}

const defaultParams: SimulationParams = {
  landInvestment: 50,
  oceanProtection: 50,
  healthcareSpending: 50,
  circularEconomyPolicy: 50,
  carbonTax: 50,
  renewableTarget: 50,
};

const policyPresets = {
  business_as_usual: { ...defaultParams },
  green_transition: {
    landInvestment: 80,
    oceanProtection: 75,
    healthcareSpending: 60,
    circularEconomyPolicy: 85,
    carbonTax: 70,
    renewableTarget: 90,
  },
  aggressive_climate: {
    landInvestment: 90,
    oceanProtection: 85,
    healthcareSpending: 70,
    circularEconomyPolicy: 95,
    carbonTax: 90,
    renewableTarget: 100,
  },
  economic_focus: {
    landInvestment: 30,
    oceanProtection: 25,
    healthcareSpending: 40,
    circularEconomyPolicy: 45,
    carbonTax: 20,
    renewableTarget: 35,
  },
};

const PolicySimulator = () => {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");
  const [baselineRCI] = useState(65);

  const updateParam = (key: keyof SimulationParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset("custom");
  };

  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      setParams(policyPresets[preset as keyof typeof policyPresets]);
    }
  };

  const resetParams = () => {
    setParams(defaultParams);
    setSelectedPreset("business_as_usual");
  };

  // Calculate simulation results
  const simulationData = useMemo((): SimulationResult[] => {
    const years = 15; // 2025-2040
    const results: SimulationResult[] = [];
    
    for (let i = 0; i <= years; i++) {
      const year = 2025 + i;
      const t = i / years;
      
      // Calculate individual capacity trajectories based on policy inputs
      const landGrowth = (params.landInvestment - 50) * 0.003 * t;
      const oceanGrowth = (params.oceanProtection - 50) * 0.0025 * t;
      const humanGrowth = (params.healthcareSpending - 50) * 0.002 * t;
      const circularGrowth = (params.circularEconomyPolicy - 50) * 0.0035 * t;
      
      // Carbon tax and renewable effects multiply overall growth
      const multiplier = 1 + ((params.carbonTax - 50) * 0.001 + (params.renewableTarget - 50) * 0.001) * t;
      
      const land = Math.min(100, Math.max(0, 65 + landGrowth * 100 * multiplier));
      const ocean = Math.min(100, Math.max(0, 55 + oceanGrowth * 100 * multiplier));
      const human = Math.min(100, Math.max(0, 60 + humanGrowth * 100 * multiplier));
      const circular = Math.min(100, Math.max(0, 50 + circularGrowth * 100 * multiplier));
      
      // Composite RCI
      const rci = (land * 0.3 + ocean * 0.25 + human * 0.25 + circular * 0.2);
      
      // Baseline (business as usual)
      const baseline = baselineRCI + (t * 2); // Slight natural improvement
      
      results.push({
        year,
        rci: Math.round(rci * 10) / 10,
        land: Math.round(land * 10) / 10,
        ocean: Math.round(ocean * 10) / 10,
        human: Math.round(human * 10) / 10,
        circular: Math.round(circular * 10) / 10,
        baseline: Math.round(baseline * 10) / 10,
      });
    }
    
    return results;
  }, [params, baselineRCI]);

  const finalRCI = simulationData[simulationData.length - 1]?.rci ?? baselineRCI;
  const rciChange = finalRCI - baselineRCI;
  const riskLevel = finalRCI < 60 ? "high" : finalRCI < 75 ? "moderate" : "low";

  const runSimulation = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1500);
  };

  return (
    <section className="py-24 bg-card relative overflow-hidden">
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
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Sovereign Intelligence Tool</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Policy <span className="text-gradient-accent">Simulation</span> Engine
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Model the impact of different policy interventions on your region's RCI trajectory. 
            Adjust parameters to see projected outcomes through 2040.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold">Policy Levers</h3>
              <Button variant="ghost" size="sm" onClick={resetParams}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Presets */}
            <div className="mb-6">
              <Label className="text-sm text-muted-foreground mb-2 block">Scenario Preset</Label>
              <Select value={selectedPreset} onValueChange={applyPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Configuration</SelectItem>
                  <SelectItem value="business_as_usual">Business as Usual</SelectItem>
                  <SelectItem value="green_transition">Green Transition</SelectItem>
                  <SelectItem value="aggressive_climate">Aggressive Climate Action</SelectItem>
                  <SelectItem value="economic_focus">Economic Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              {[
                { key: "landInvestment" as const, label: "Land Regeneration Investment", icon: <Leaf className="w-4 h-4" /> },
                { key: "oceanProtection" as const, label: "Ocean Protection Level", icon: <Waves className="w-4 h-4" /> },
                { key: "healthcareSpending" as const, label: "Healthcare & Wellbeing", icon: <Heart className="w-4 h-4" /> },
                { key: "circularEconomyPolicy" as const, label: "Circular Economy Policy", icon: <Recycle className="w-4 h-4" /> },
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-primary">{params[item.key]}%</span>
                  </div>
                  <Slider
                    value={[params[item.key]]}
                    onValueChange={(v) => updateParam(item.key, v[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              ))}

              <div className="pt-4 border-t border-border space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Carbon Tax Rate</span>
                    <span className="font-medium text-primary">{params.carbonTax}%</span>
                  </div>
                  <Slider
                    value={[params.carbonTax]}
                    onValueChange={(v) => updateParam("carbonTax", v[0])}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Renewable Energy Target</span>
                    <span className="font-medium text-primary">{params.renewableTarget}%</span>
                  </div>
                  <Slider
                    value={[params.renewableTarget]}
                    onValueChange={(v) => updateParam("renewableTarget", v[0])}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-6"
              onClick={runSimulation}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                  </motion.div>
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">2040 Projected RCI</div>
                <div className="text-3xl font-bold text-gradient-primary">{finalRCI}</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">RCI Change</div>
                <div className={`text-3xl font-bold flex items-center gap-2 ${
                  rciChange >= 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  {rciChange >= 0 ? "+" : ""}{rciChange.toFixed(1)}
                  <TrendingUp className={`w-5 h-5 ${rciChange < 0 ? "rotate-180" : ""}`} />
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                <div className={`text-lg font-bold flex items-center gap-2 ${
                  riskLevel === "low" ? "text-emerald-400" : 
                  riskLevel === "moderate" ? "text-amber-400" : "text-red-400"
                }`}>
                  {riskLevel === "low" ? <CheckCircle2 className="w-5 h-5" /> : 
                   riskLevel === "moderate" ? <AlertTriangle className="w-5 h-5" /> :
                   <AlertTriangle className="w-5 h-5" />}
                  <span className="capitalize">{riskLevel}</span>
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold mb-4">RCI Trajectory Projection</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={simulationData}>
                  <defs>
                    <linearGradient id="rciGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(165, 60%, 45%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(165, 60%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                  <XAxis dataKey="year" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} domain={[40, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 20%, 10%)",
                      border: "1px solid hsl(220, 15%, 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <ReferenceLine y={75} stroke="hsl(165, 60%, 45%)" strokeDasharray="5 5" label="Target" />
                  <Area
                    type="monotone"
                    dataKey="rci"
                    stroke="hsl(165, 60%, 45%)"
                    strokeWidth={2}
                    fill="url(#rciGrad)"
                    name="Projected RCI"
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="hsl(220, 10%, 55%)"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    dot={false}
                    name="Baseline"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sector Breakdown */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold mb-4">Sector Capacity Projections</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={simulationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                  <XAxis dataKey="year" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} domain={[40, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 20%, 10%)",
                      border: "1px solid hsl(220, 15%, 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="land" stroke="hsl(165, 60%, 45%)" strokeWidth={2} dot={false} name="Land" />
                  <Line type="monotone" dataKey="ocean" stroke="hsl(200, 60%, 50%)" strokeWidth={2} dot={false} name="Ocean" />
                  <Line type="monotone" dataKey="human" stroke="hsl(38, 90%, 55%)" strokeWidth={2} dot={false} name="Human" />
                  <Line type="monotone" dataKey="circular" stroke="hsl(280, 60%, 55%)" strokeWidth={2} dot={false} name="Circular" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {[
                  { label: "Land", color: "bg-emerald-500" },
                  { label: "Ocean", color: "bg-sky-500" },
                  { label: "Human", color: "bg-amber-500" },
                  { label: "Circular", color: "bg-purple-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className={`w-3 h-3 rounded ${item.color}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PolicySimulator;
