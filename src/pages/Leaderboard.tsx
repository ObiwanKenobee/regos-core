import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  TreeDeciduous,
  Droplets,
  Activity,
  Repeat,
  Medal,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const capacityConfig = {
  land: { icon: TreeDeciduous, color: "#22c55e", label: "Land" },
  ocean: { icon: Droplets, color: "#3b82f6", label: "Ocean" },
  human: { icon: Activity, color: "#f43f5e", label: "Human" },
  circular: { icon: Repeat, color: "#a855f7", label: "Circular" },
};

const Leaderboard = () => {
  const { data: regions = [], isLoading } = useQuery({
    queryKey: ["leaderboard-regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rci_regions")
        .select("*")
        .order("rci_score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: rciHistory = [] } = useQuery({
    queryKey: ["leaderboard-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rci_history")
        .select(`
          *,
          region:rci_regions(region_name, region_code)
        `)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const topRegions = regions.slice(0, 10);
  const globalAverage = regions.length > 0
    ? regions.reduce((sum, r) => sum + Number(r.rci_score), 0) / regions.length
    : 0;

  const trendData = useMemo(() => {
    const monthlyAverages: Record<string, { month: string; average: number; count: number }> = {};
    
    rciHistory.forEach((h) => {
      const month = new Date(h.recorded_at).toISOString().slice(0, 7);
      if (!monthlyAverages[month]) {
        monthlyAverages[month] = { month, average: 0, count: 0 };
      }
      monthlyAverages[month].average += Number(h.rci_score);
      monthlyAverages[month].count += 1;
    });

    return Object.values(monthlyAverages)
      .map((m) => ({ month: m.month, average: m.average / m.count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [rciHistory]);

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (trend: string | null) => {
    switch (trend) {
      case "improving":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Improving</Badge>;
      case "declining":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Declining</Badge>;
      default:
        return <Badge variant="secondary">Stable</Badge>;
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">{index + 1}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    if (score >= 30) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">Global RCI Rankings</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Regenerative Capacity Leaderboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track which regions are leading the way in regenerative capacity and
              sustainable development
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-strong">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Regions</p>
                    <p className="text-2xl font-bold text-foreground">{regions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/20">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Global Average</p>
                    <p className="text-2xl font-bold text-foreground">{globalAverage.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-yellow-500/20">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top Score</p>
                    <p className="text-2xl font-bold text-foreground">
                      {regions[0]?.rci_score?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Improving</p>
                    <p className="text-2xl font-bold text-foreground">
                      {regions.filter((r) => r.rci_trend === "improving").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top 3 Podium */}
            <Card className="glass-strong lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topRegions.slice(0, 3).map((region, index) => (
                  <div
                    key={region.id}
                    className={`p-4 rounded-xl border ${
                      index === 0
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : index === 1
                        ? "bg-gray-500/10 border-gray-500/30"
                        : "bg-amber-600/10 border-amber-600/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                        <span className="font-semibold text-foreground">
                          {region.region_name}
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${getScoreColor(region.rci_score)}`}>
                        {region.rci_score.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getTrendIcon(region.rci_trend)}
                      <span className="capitalize">{region.rci_trend || "stable"}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Global Trend Chart */}
            <Card className="glass-strong lg:col-span-2">
              <CardHeader>
                <CardTitle>Global RCI Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="average"
                        stroke="hsl(var(--primary))"
                        fill="url(#colorAverage)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Capacity Breakdown Chart */}
          <Card className="glass-strong mb-8">
            <CardHeader>
              <CardTitle>Top 10 Regions - Capacity Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRegions} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                    <YAxis
                      type="category"
                      dataKey="region_name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip
                      formatter={(value: number) => `${value?.toFixed(1) || 0}%`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="land_capacity" fill="#22c55e" name="Land" stackId="a" />
                    <Bar dataKey="ocean_capacity" fill="#3b82f6" name="Ocean" stackId="a" />
                    <Bar dataKey="human_capacity" fill="#f43f5e" name="Human" stackId="a" />
                    <Bar dataKey="circular_capacity" fill="#a855f7" name="Circular" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {Object.entries(capacityConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                      <span className="text-sm text-muted-foreground">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Full Rankings Table */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Complete Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>RCI Score</TableHead>
                    <TableHead>Land</TableHead>
                    <TableHead>Ocean</TableHead>
                    <TableHead>Human</TableHead>
                    <TableHead>Circular</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regions.map((region, index) => (
                    <TableRow key={region.id}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getRankIcon(index)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{region.region_name}</div>
                        <div className="text-xs text-muted-foreground">{region.region_code}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${getScoreColor(region.rci_score)}`}>
                          {region.rci_score.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{region.land_capacity?.toFixed(1) || "-"}%</TableCell>
                      <TableCell>{region.ocean_capacity?.toFixed(1) || "-"}%</TableCell>
                      <TableCell>{region.human_capacity?.toFixed(1) || "-"}%</TableCell>
                      <TableCell>{region.circular_capacity?.toFixed(1) || "-"}%</TableCell>
                      <TableCell>{getTrendBadge(region.rci_trend)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {region.last_updated
                          ? new Date(region.last_updated).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;
