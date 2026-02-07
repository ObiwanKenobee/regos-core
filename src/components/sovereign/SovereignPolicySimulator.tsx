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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Save,
  Share2,
  Download,
  Factory,
  Wind,
  Droplets,
  TreeDeciduous,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SimulationParams {
  // Core policy levers
  landInvestment: number;
  oceanProtection: number;
  healthcareSpending: number;
  circularEconomyPolicy: number;
  // Energy & Climate
  carbonTax: number;
  renewableTarget: number;
  // Additional levers
  forestryProtection: number;
  waterManagement: number;
  industrialEfficiency: number;
  biodiversitySpending: number;
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
  forestryProtection: 50,
  waterManagement: 50,
  industrialEfficiency: 50,
  biodiversitySpending: 50,
};

const policyPresets = {
  business_as_usual: { ...defaultParams, name: "Business as Usual" },
  green_transition: {
    ...defaultParams,
    landInvestment: 80,
    oceanProtection: 75,
    healthcareSpending: 60,
    circularEconomyPolicy: 85,
    carbonTax: 70,
    renewableTarget: 90,
    forestryProtection: 85,
    waterManagement: 70,
    industrialEfficiency: 75,
    biodiversitySpending: 80,
    name: "Green Transition",
  },
  aggressive_climate: {
    ...defaultParams,
    landInvestment: 90,
    oceanProtection: 85,
    healthcareSpending: 70,
    circularEconomyPolicy: 95,
    carbonTax: 90,
    renewableTarget: 100,
    forestryProtection: 95,
    waterManagement: 85,
    industrialEfficiency: 90,
    biodiversitySpending: 90,
    name: "Aggressive Climate Action",
  },
  economic_focus: {
    ...defaultParams,
    landInvestment: 30,
    oceanProtection: 25,
    healthcareSpending: 40,
    circularEconomyPolicy: 45,
    carbonTax: 20,
    renewableTarget: 35,
    forestryProtection: 30,
    waterManagement: 40,
    industrialEfficiency: 60,
    biodiversitySpending: 25,
    name: "Economic Focus",
  },
  balanced_growth: {
    ...defaultParams,
    landInvestment: 65,
    oceanProtection: 60,
    healthcareSpending: 70,
    circularEconomyPolicy: 65,
    carbonTax: 55,
    renewableTarget: 70,
    forestryProtection: 60,
    waterManagement: 65,
    industrialEfficiency: 70,
    biodiversitySpending: 60,
    name: "Balanced Growth",
  },
};

const policyCategories = [
  {
    id: "natural",
    label: "Natural Capital",
    icon: Leaf,
    policies: [
      { key: "landInvestment" as const, label: "Land Regeneration", icon: TreeDeciduous },
      { key: "oceanProtection" as const, label: "Ocean Protection", icon: Waves },
      { key: "forestryProtection" as const, label: "Forestry Protection", icon: TreeDeciduous },
      { key: "biodiversitySpending" as const, label: "Biodiversity Investment", icon: Leaf },
    ],
  },
  {
    id: "social",
    label: "Social & Human",
    icon: Heart,
    policies: [
      { key: "healthcareSpending" as const, label: "Healthcare & Wellbeing", icon: Heart },
      { key: "waterManagement" as const, label: "Water Access & Quality", icon: Droplets },
    ],
  },
  {
    id: "circular",
    label: "Circular Economy",
    icon: Recycle,
    policies: [
      { key: "circularEconomyPolicy" as const, label: "Circular Economy Policy", icon: Recycle },
      { key: "industrialEfficiency" as const, label: "Industrial Efficiency", icon: Factory },
    ],
  },
  {
    id: "climate",
    label: "Climate & Energy",
    icon: Wind,
    policies: [
      { key: "carbonTax" as const, label: "Carbon Pricing", icon: Factory },
      { key: "renewableTarget" as const, label: "Renewable Energy Target", icon: Wind },
    ],
  },
];

interface SovereignPolicySimulatorProps {
  regionName?: string;
  baselineRCI?: number;
}

export const SovereignPolicySimulator = ({ 
  regionName = "Your Territory",
  baselineRCI = 65,
}: SovereignPolicySimulatorProps) => {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");
  const [activeCategory, setActiveCategory] = useState("natural");
  const [savedScenarios, setSavedScenarios] = useState<Array<{ name: string; params: SimulationParams }>>([]);

  const updateParam = (key: keyof SimulationParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset("custom");
  };

  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== "custom" && preset in policyPresets) {
      const presetData = policyPresets[preset as keyof typeof policyPresets];
      setParams(presetData);
    }
  };

  const resetParams = () => {
    setParams(defaultParams);
    setSelectedPreset("business_as_usual");
  };

  const saveScenario = () => {
    const name = `Scenario ${savedScenarios.length + 1}`;
    setSavedScenarios([...savedScenarios, { name, params: { ...params } }]);
    toast({
      title: "Scenario Saved",
      description: `"${name}" has been saved for comparison.`,
    });
  };

  // Calculate simulation results
  const simulationData = useMemo((): SimulationResult[] => {
    const years = 15; // 2025-2040
    const results: SimulationResult[] = [];

    for (let i = 0; i <= years; i++) {
      const year = 2025 + i;
      const t = i / years;

      // Calculate individual capacity trajectories based on policy inputs
      const landGrowth = (params.landInvestment - 50) * 0.003 * t +
        (params.forestryProtection - 50) * 0.002 * t;
      const oceanGrowth = (params.oceanProtection - 50) * 0.0025 * t +
        (params.biodiversitySpending - 50) * 0.001 * t;
      const humanGrowth = (params.healthcareSpending - 50) * 0.002 * t +
        (params.waterManagement - 50) * 0.0015 * t;
      const circularGrowth = (params.circularEconomyPolicy - 50) * 0.0035 * t +
        (params.industrialEfficiency - 50) * 0.002 * t;

      // Carbon tax and renewable effects multiply overall growth
      const multiplier = 1 + ((params.carbonTax - 50) * 0.001 + (params.renewableTarget - 50) * 0.001) * t;

      const land = Math.min(100, Math.max(0, 65 + landGrowth * 100 * multiplier));
      const ocean = Math.min(100, Math.max(0, 55 + oceanGrowth * 100 * multiplier));
      const human = Math.min(100, Math.max(0, 60 + humanGrowth * 100 * multiplier));
      const circular = Math.min(100, Math.max(0, 50 + circularGrowth * 100 * multiplier));

      // Composite RCI
      const rci = land * 0.3 + ocean * 0.25 + human * 0.25 + circular * 0.2;

      // Baseline (business as usual)
      const baseline = baselineRCI + t * 2;

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

  // Radar chart data
  const radarData = useMemo(() => {
    const final = simulationData[simulationData.length - 1];
    return [
      { subject: "Land", value: final?.land || 0, fullMark: 100 },
      { subject: "Ocean", value: final?.ocean || 0, fullMark: 100 },
      { subject: "Human", value: final?.human || 0, fullMark: 100 },
      { subject: "Circular", value: final?.circular || 0, fullMark: 100 },
    ];
  }, [simulationData]);

  const finalRCI = simulationData[simulationData.length - 1]?.rci ?? baselineRCI;
  const rciChange = finalRCI - baselineRCI;
  const riskLevel = finalRCI < 60 ? "high" : finalRCI < 75 ? "moderate" : "low";

  const runSimulation = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1500);
  };

  const activeSection = policyCategories.find((c) => c.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Policy Simulation Engine</h2>
          <p className="text-muted-foreground">
            Model the impact of policy interventions on {regionName}'s RCI trajectory through 2040
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveScenario}>
            <Save className="w-4 h-4 mr-2" />
            Save Scenario
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <Card className="glass-strong border-border/50 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Policy Levers</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetParams}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Scenario Preset</Label>
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
                  <SelectItem value="balanced_growth">Balanced Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {policyCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat.id)}
                    className="gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{cat.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Policy Sliders */}
            <div className="space-y-5">
              {activeSection?.policies.map((policy) => {
                const Icon = policy.icon;
                return (
                  <div key={policy.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{policy.label}</span>
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {params[policy.key]}%
                      </span>
                    </div>
                    <Slider
                      value={[params[policy.key]]}
                      onValueChange={(v) => updateParam(policy.key, v[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>

            <Button className="w-full" onClick={runSimulation} disabled={isRunning}>
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
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="glass-strong border-border/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">2040 Projected RCI</div>
                <div className="text-3xl font-bold text-primary">{finalRCI.toFixed(1)}</div>
              </CardContent>
            </Card>
            <Card className="glass-strong border-border/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">RCI Change</div>
                <div className={`text-3xl font-bold flex items-center gap-2 ${
                  rciChange >= 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  {rciChange >= 0 ? "+" : ""}{rciChange.toFixed(1)}
                  <TrendingUp className={`w-5 h-5 ${rciChange < 0 ? "rotate-180" : ""}`} />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-strong border-border/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                <div className={`text-lg font-bold flex items-center gap-2 ${
                  riskLevel === "low" ? "text-emerald-400" :
                  riskLevel === "moderate" ? "text-amber-400" : "text-red-400"
                }`}>
                  {riskLevel === "low" ? <CheckCircle2 className="w-5 h-5" /> :
                   <AlertTriangle className="w-5 h-5" />}
                  <span className="capitalize">{riskLevel}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="trajectory" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trajectory">RCI Trajectory</TabsTrigger>
              <TabsTrigger value="sectors">Sector Breakdown</TabsTrigger>
              <TabsTrigger value="radar">Capacity Radar</TabsTrigger>
            </TabsList>

            <TabsContent value="trajectory">
              <Card className="glass-strong border-border/50">
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={simulationData}>
                      <defs>
                        <linearGradient id="simRciGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[40, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <ReferenceLine y={75} stroke="hsl(var(--primary))" strokeDasharray="5 5" label="Target" />
                      <Area
                        type="monotone"
                        dataKey="rci"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#simRciGrad)"
                        name="Projected RCI"
                      />
                      <Line
                        type="monotone"
                        dataKey="baseline"
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="5 5"
                        strokeWidth={1.5}
                        dot={false}
                        name="Baseline"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sectors">
              <Card className="glass-strong border-border/50">
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={simulationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[40, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
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
                      { label: "Circular", color: "bg-violet-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className={`w-3 h-3 rounded ${item.color}`} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="radar">
              <Card className="glass-strong border-border/50">
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <Radar
                        name="2040 Capacity"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SovereignPolicySimulator;
