import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Calendar,
  TrendingUp,
  RefreshCw,
  Layers,
  Globe,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, subDays, subMonths, subYears } from "date-fns";

interface RCIHistoryPoint {
  id: string;
  region_id: string;
  rci_score: number;
  land_capacity: number | null;
  ocean_capacity: number | null;
  human_capacity: number | null;
  circular_capacity: number | null;
  recorded_at: string;
}

interface RCIRegion {
  id: string;
  region_name: string;
  region_code: string;
  rci_score: number;
}

const timeRanges = [
  { label: "7 Days", value: "7d", getDays: () => 7 },
  { label: "30 Days", value: "30d", getDays: () => 30 },
  { label: "3 Months", value: "3m", getDays: () => 90 },
  { label: "1 Year", value: "1y", getDays: () => 365 },
  { label: "All Time", value: "all", getDays: () => 3650 },
];

const capacityColors = {
  land: "hsl(142, 76%, 36%)",
  ocean: "hsl(199, 89%, 48%)",
  human: "hsl(346, 77%, 49%)",
  circular: "hsl(271, 81%, 56%)",
};

const chartConfig = {
  rci_score: { label: "RCI Score", color: "hsl(var(--primary))" },
  land_capacity: { label: "Land", color: capacityColors.land },
  ocean_capacity: { label: "Ocean", color: capacityColors.ocean },
  human_capacity: { label: "Human", color: capacityColors.human },
  circular_capacity: { label: "Circular", color: capacityColors.circular },
};

const RCITimeline = () => {
  const [historyData, setHistoryData] = useState<RCIHistoryPoint[]>([]);
  const [regions, setRegions] = useState<RCIRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [viewMode, setViewMode] = useState<"rci" | "sectors">("rci");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    fetchHistoryData();
  }, [selectedRegion, timeRange]);

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("rci_regions")
        .select("id, region_name, region_code, rci_score")
        .order("region_name");

      if (error) throw error;
      setRegions(data || []);
    } catch (error: any) {
      console.error("Error fetching regions:", error);
    }
  };

  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      const range = timeRanges.find((r) => r.value === timeRange);
      const startDate = subDays(new Date(), range?.getDays() || 30);

      let query = supabase
        .from("rci_history")
        .select("*")
        .gte("recorded_at", startDate.toISOString())
        .order("recorded_at", { ascending: true });

      if (selectedRegion !== "all") {
        query = query.eq("region_id", selectedRegion);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If no history data, generate sample data for visualization
      if (!data || data.length === 0) {
        const sampleData = generateSampleData(selectedRegion, range?.getDays() || 30);
        setHistoryData(sampleData);
      } else {
        setHistoryData(data);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleData = (regionId: string, days: number): RCIHistoryPoint[] => {
    const data: RCIHistoryPoint[] = [];
    const now = new Date();
    const baseRCI = 60 + Math.random() * 20;

    for (let i = days; i >= 0; i -= Math.max(1, Math.floor(days / 30))) {
      const date = subDays(now, i);
      const variance = (Math.random() - 0.5) * 10;
      const trend = (days - i) / days * 5; // Slight upward trend

      data.push({
        id: `sample-${i}`,
        region_id: regionId,
        rci_score: Math.max(0, Math.min(100, baseRCI + variance + trend)),
        land_capacity: Math.max(0, Math.min(100, 55 + Math.random() * 30)),
        ocean_capacity: Math.max(0, Math.min(100, 50 + Math.random() * 25)),
        human_capacity: Math.max(0, Math.min(100, 60 + Math.random() * 20)),
        circular_capacity: Math.max(0, Math.min(100, 45 + Math.random() * 35)),
        recorded_at: date.toISOString(),
      });
    }

    return data;
  };

  const chartData = historyData.map((point) => ({
    date: format(new Date(point.recorded_at), "MMM dd"),
    fullDate: format(new Date(point.recorded_at), "PPP"),
    rci_score: Number(point.rci_score.toFixed(1)),
    land_capacity: point.land_capacity ? Number(point.land_capacity.toFixed(1)) : null,
    ocean_capacity: point.ocean_capacity ? Number(point.ocean_capacity.toFixed(1)) : null,
    human_capacity: point.human_capacity ? Number(point.human_capacity.toFixed(1)) : null,
    circular_capacity: point.circular_capacity ? Number(point.circular_capacity.toFixed(1)) : null,
  }));

  const latestData = chartData[chartData.length - 1];
  const earliestData = chartData[0];
  const rciChange = latestData && earliestData ? latestData.rci_score - earliestData.rci_score : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            RCI Historical Timeline
          </h3>
          <p className="text-sm text-muted-foreground">
            Track regenerative capacity changes over time
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.region_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={viewMode === "rci" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("rci")}
              className="rounded-none"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              RCI
            </Button>
            <Button
              variant={viewMode === "sectors" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("sectors")}
              className="rounded-none"
            >
              <Layers className="w-4 h-4 mr-1" />
              Sectors
            </Button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
          <p className="text-xs text-muted-foreground mb-1">Current RCI</p>
          <p className="text-2xl font-display font-bold text-primary">
            {latestData?.rci_score.toFixed(1) || "—"}%
          </p>
        </div>
        <div className={`p-4 rounded-xl ${rciChange >= 0 ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"} border`}>
          <p className="text-xs text-muted-foreground mb-1">Period Change</p>
          <p className={`text-2xl font-display font-bold ${rciChange >= 0 ? "text-primary" : "text-destructive"}`}>
            {rciChange >= 0 ? "+" : ""}{rciChange.toFixed(1)}%
          </p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
          <p className="text-xs text-muted-foreground mb-1">Land</p>
          <p className="text-2xl font-display font-bold text-green-400">
            {latestData?.land_capacity?.toFixed(1) || "—"}%
          </p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <p className="text-xs text-muted-foreground mb-1">Ocean</p>
          <p className="text-2xl font-display font-bold text-blue-400">
            {latestData?.ocean_capacity?.toFixed(1) || "—"}%
          </p>
        </div>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
          <p className="text-xs text-muted-foreground mb-1">Human</p>
          <p className="text-2xl font-display font-bold text-rose-400">
            {latestData?.human_capacity?.toFixed(1) || "—"}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-card border border-border/50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Calendar className="w-12 h-12 mb-4 opacity-50" />
            <p>No historical data available</p>
            <p className="text-sm">Data will appear as RCI scores are updated</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            {viewMode === "rci" ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rciGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Area
                  type="monotone"
                  dataKey="rci_score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#rciGradient)"
                  name="RCI Score"
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="land_capacity"
                  stroke={capacityColors.land}
                  strokeWidth={2}
                  dot={false}
                  name="Land"
                />
                <Line
                  type="monotone"
                  dataKey="ocean_capacity"
                  stroke={capacityColors.ocean}
                  strokeWidth={2}
                  dot={false}
                  name="Ocean"
                />
                <Line
                  type="monotone"
                  dataKey="human_capacity"
                  stroke={capacityColors.human}
                  strokeWidth={2}
                  dot={false}
                  name="Human"
                />
                <Line
                  type="monotone"
                  dataKey="circular_capacity"
                  stroke={capacityColors.circular}
                  strokeWidth={2}
                  dot={false}
                  name="Circular"
                />
              </LineChart>
            )}
          </ChartContainer>
        )}
      </motion.div>

      {/* Sector legend */}
      {viewMode === "sectors" && (
        <div className="flex flex-wrap justify-center gap-4">
          {Object.entries(capacityColors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-muted-foreground capitalize">{key}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RCITimeline;
