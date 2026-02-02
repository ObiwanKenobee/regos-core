import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import {
  Scale,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  TreeDeciduous,
  Droplets,
  Activity,
  Repeat,
} from "lucide-react";

const COLORS = ["hsl(var(--primary))", "#22c55e", "#f43f5e", "#a855f7", "#f59e0b"];

interface Region {
  id: string;
  region_name: string;
  region_code: string;
  rci_score: number;
  land_capacity: number | null;
  ocean_capacity: number | null;
  human_capacity: number | null;
  circular_capacity: number | null;
  rci_trend: string | null;
  last_updated: string | null;
}

export function RegionComparison() {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const { data: regions = [] } = useQuery({
    queryKey: ["comparison-regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rci_regions")
        .select("*")
        .order("region_name");
      if (error) throw error;
      return data as Region[];
    },
  });

  const selectedRegionData = useMemo(() => {
    return regions.filter((r) => selectedRegions.includes(r.id));
  }, [regions, selectedRegions]);

  const addRegion = (regionId: string) => {
    if (selectedRegions.length < 5 && !selectedRegions.includes(regionId)) {
      setSelectedRegions([...selectedRegions, regionId]);
    }
  };

  const removeRegion = (regionId: string) => {
    setSelectedRegions(selectedRegions.filter((id) => id !== regionId));
  };

  const radarData = useMemo(() => {
    const metrics = [
      { metric: "Land", key: "land_capacity" },
      { metric: "Ocean", key: "ocean_capacity" },
      { metric: "Human", key: "human_capacity" },
      { metric: "Circular", key: "circular_capacity" },
    ];

    return metrics.map((m) => {
      const item: Record<string, string | number> = { metric: m.metric };
      selectedRegionData.forEach((region) => {
        item[region.region_name] = Number(region[m.key as keyof Region]) || 0;
      });
      return item;
    });
  }, [selectedRegionData]);

  const barData = useMemo(() => {
    return selectedRegionData.map((region) => ({
      name: region.region_name,
      rci: region.rci_score,
      land: region.land_capacity || 0,
      ocean: region.ocean_capacity || 0,
      human: region.human_capacity || 0,
      circular: region.circular_capacity || 0,
    }));
  }, [selectedRegionData]);

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

  const availableRegions = regions.filter(
    (r) => !selectedRegions.includes(r.id)
  );

  return (
    <div className="space-y-6">
      {/* Region Selection */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Compare Regions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {selectedRegionData.map((region, index) => (
              <Badge
                key={region.id}
                className="flex items-center gap-2 px-3 py-2"
                style={{
                  backgroundColor: `${COLORS[index]}20`,
                  borderColor: COLORS[index],
                  color: COLORS[index],
                }}
              >
                <span className="font-medium">{region.region_name}</span>
                <button
                  onClick={() => removeRegion(region.id)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {selectedRegions.length < 5 && (
            <div className="flex items-center gap-2">
              <Select onValueChange={addRegion}>
                <SelectTrigger className="w-[250px]">
                  <Plus className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Add a region to compare" />
                </SelectTrigger>
                <SelectContent>
                  {availableRegions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.region_name} ({region.rci_score.toFixed(1)}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {selectedRegions.length}/5 regions selected
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRegions.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {selectedRegionData.map((region, index) => (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="glass-strong border-l-4"
                  style={{ borderLeftColor: COLORS[index] }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground truncate">
                        {region.region_name}
                      </span>
                      {getTrendIcon(region.rci_trend)}
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {region.rci_score.toFixed(1)}%
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <TreeDeciduous className="w-3 h-3 text-green-500" /> Land
                        </span>
                        <span>{region.land_capacity?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-500" /> Ocean
                        </span>
                        <span>{region.ocean_capacity?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-rose-500" /> Human
                        </span>
                        <span>{region.human_capacity?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3 h-3 text-purple-500" /> Circular
                        </span>
                        <span>{region.circular_capacity?.toFixed(1) || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle>Capacity Comparison (Radar)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      />
                      {selectedRegionData.map((region, index) => (
                        <Radar
                          key={region.id}
                          name={region.region_name}
                          dataKey={region.region_name}
                          stroke={COLORS[index]}
                          fill={COLORS[index]}
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle>Overall RCI Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="rci" name="RCI Score" radius={[0, 4, 4, 0]}>
                        {barData.map((_, index) => (
                          <motion.rect
                            key={index}
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            fill={COLORS[index]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stacked Capacity Chart */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Capacity Breakdown Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="land" name="Land" fill="#22c55e" stackId="a" />
                    <Bar dataKey="ocean" name="Ocean" fill="#3b82f6" stackId="a" />
                    <Bar dataKey="human" name="Human" fill="#f43f5e" stackId="a" />
                    <Bar dataKey="circular" name="Circular" fill="#a855f7" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedRegions.length === 0 && (
        <Card className="glass-strong">
          <CardContent className="py-16 text-center">
            <Scale className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Select regions to compare
            </h3>
            <p className="text-muted-foreground">
              Choose up to 5 regions to see a side-by-side comparison of their RCI metrics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
