import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Leaf,
  Waves,
  Users,
  Recycle,
  Target,
  Award,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface Region {
  id: string;
  region_code: string;
  region_name: string;
  rci_score: number;
  land_capacity: number | null;
  ocean_capacity: number | null;
  human_capacity: number | null;
  circular_capacity: number | null;
  rci_trend: string | null;
  last_updated: string | null;
}

interface NationalDashboardProps {
  regions: Region[];
  isLoading: boolean;
}

const CAPACITY_COLORS = {
  land: "hsl(165, 60%, 45%)",
  ocean: "hsl(200, 60%, 50%)",
  human: "hsl(38, 90%, 55%)",
  circular: "hsl(280, 60%, 55%)",
};

export const NationalDashboard = ({ regions, isLoading }: NationalDashboardProps) => {
  // Compute aggregate statistics
  const stats = useMemo(() => {
    if (!regions.length) return null;

    const avgRCI = regions.reduce((acc, r) => acc + r.rci_score, 0) / regions.length;
    const avgLand = regions.reduce((acc, r) => acc + (r.land_capacity || 0), 0) / regions.length;
    const avgOcean = regions.reduce((acc, r) => acc + (r.ocean_capacity || 0), 0) / regions.length;
    const avgHuman = regions.reduce((acc, r) => acc + (r.human_capacity || 0), 0) / regions.length;
    const avgCircular = regions.reduce((acc, r) => acc + (r.circular_capacity || 0), 0) / regions.length;

    const improving = regions.filter((r) => r.rci_trend === "improving").length;
    const declining = regions.filter((r) => r.rci_trend === "declining").length;

    const topRegions = [...regions].sort((a, b) => b.rci_score - a.rci_score).slice(0, 5);
    const bottomRegions = [...regions].sort((a, b) => a.rci_score - b.rci_score).slice(0, 5);

    return {
      avgRCI,
      avgLand,
      avgOcean,
      avgHuman,
      avgCircular,
      improving,
      declining,
      stable: regions.length - improving - declining,
      topRegions,
      bottomRegions,
      totalRegions: regions.length,
    };
  }, [regions]);

  // Generate mock historical data for charts
  const historicalData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month, i) => ({
      month,
      rci: 60 + Math.random() * 20 + i * 2,
      land: 55 + Math.random() * 15 + i * 1.5,
      ocean: 50 + Math.random() * 18 + i * 1.2,
      human: 58 + Math.random() * 12 + i * 1.8,
      circular: 45 + Math.random() * 20 + i * 2,
    }));
  }, []);

  // Capacity breakdown for pie chart
  const capacityBreakdown = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Land", value: stats.avgLand, color: CAPACITY_COLORS.land },
      { name: "Ocean", value: stats.avgOcean, color: CAPACITY_COLORS.ocean },
      { name: "Human", value: stats.avgHuman, color: CAPACITY_COLORS.human },
      { name: "Circular", value: stats.avgCircular, color: CAPACITY_COLORS.circular },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="glass-strong border-border/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="glass-strong border-border/50">
        <CardContent className="p-12 text-center">
          <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Regions Assigned</h3>
          <p className="text-muted-foreground">
            Contact an administrator to assign regions to your account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="glass-strong border-border/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  National Avg
                </Badge>
              </div>
              <div className="text-3xl font-bold font-display text-foreground">
                {stats.avgRCI.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground">RCI Score</p>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-primary flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" />
                  +2.4%
                </span>
                <span className="text-muted-foreground">vs last quarter</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-strong border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-2xl font-bold text-emerald-500">{stats.improving}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Regions Improving</p>
              <Progress 
                value={(stats.improving / stats.totalRegions) * 100} 
                className="h-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-strong border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <span className="text-2xl font-bold text-destructive">{stats.declining}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Regions Declining</p>
              <Progress 
                value={(stats.declining / stats.totalRegions) * 100} 
                className="h-2 [&>div]:bg-destructive"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-strong border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Globe className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-2xl font-bold text-foreground">{stats.totalRegions}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Total Territories</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last updated 2h ago
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RCI Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="glass-strong border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-primary" />
                National RCI Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="nationalRciGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    domain={[50, 90]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rci"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#nationalRciGrad)"
                    name="RCI Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Capacity Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-strong border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Capacity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={capacityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {capacityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { icon: Leaf, label: "Land", value: stats.avgLand, color: "text-emerald-500" },
                  { icon: Waves, label: "Ocean", value: stats.avgOcean, color: "text-sky-500" },
                  { icon: Users, label: "Human", value: stats.avgHuman, color: "text-amber-500" },
                  { icon: Recycle, label: "Circular", value: stats.avgCircular, color: "text-violet-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <item.icon className={`w-3 h-3 ${item.color}`} />
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium ml-auto">{item.value.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Regional Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-strong border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="w-4 h-4 text-amber-500" />
                Top Performing Regions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.topRegions.map((region, index) => (
                <div
                  key={region.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? "bg-amber-500/20 text-amber-500" :
                    index === 1 ? "bg-slate-400/20 text-slate-400" :
                    index === 2 ? "bg-amber-700/20 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{region.region_name}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {region.region_code}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{region.rci_score.toFixed(1)}</span>
                    {region.rci_trend === "improving" && (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Needs Attention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-strong border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="w-4 h-4 text-destructive" />
                Regions Needing Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.bottomRegions.map((region, index) => (
                <div
                  key={region.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{region.region_name}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {region.region_code}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-destructive">{region.rci_score.toFixed(1)}</span>
                    {region.rci_trend === "declining" && (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sector Performance Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="glass-strong border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sector Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="land" fill={CAPACITY_COLORS.land} radius={[4, 4, 0, 0]} name="Land" />
                <Bar dataKey="ocean" fill={CAPACITY_COLORS.ocean} radius={[4, 4, 0, 0]} name="Ocean" />
                <Bar dataKey="human" fill={CAPACITY_COLORS.human} radius={[4, 4, 0, 0]} name="Human" />
                <Bar dataKey="circular" fill={CAPACITY_COLORS.circular} radius={[4, 4, 0, 0]} name="Circular" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NationalDashboard;
