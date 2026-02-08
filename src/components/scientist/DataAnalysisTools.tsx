import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Layers,
  Filter,
  RefreshCw,
  Download,
  BarChart3,
  Zap,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RCIHistory {
  id: string;
  region_id: string;
  region_name: string;
  rci_score: number;
  recorded_at: string;
  land_capacity: number | null;
  ocean_capacity: number | null;
  human_capacity: number | null;
  circular_capacity: number | null;
}

interface Region {
  id: string;
  region_name: string;
  region_code: string;
}

export const DataAnalysisTools = () => {
  const [rciHistory, setRciHistory] = useState<RCIHistory[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [analysisType, setAnalysisType] = useState<"trend" | "correlation" | "capacity">("trend");

  useEffect(() => {
    fetchData();
  }, [selectedRegion]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch regions
      const { data: regionsData } = await supabase
        .from("rci_regions")
        .select("id, region_name, region_code")
        .order("region_name");

      setRegions(regionsData || []);

      // Fetch RCI history
      let query = supabase
        .from("rci_history")
        .select(`
          *,
          region:rci_regions(region_name)
        `)
        .order("recorded_at", { ascending: true })
        .limit(200);

      if (selectedRegion !== "all") {
        query = query.eq("region_id", selectedRegion);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted: RCIHistory[] = (data || []).map((h: any) => ({
        ...h,
        region_name: h.region?.region_name || "Unknown",
      }));

      setRciHistory(formatted);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const csv = rciHistory.map((h) => 
      `${h.region_name},${h.rci_score},${h.land_capacity || ''},${h.ocean_capacity || ''},${h.human_capacity || ''},${h.circular_capacity || ''},${h.recorded_at}`
    ).join("\n");
    
    const header = "Region,RCI Score,Land,Ocean,Human,Circular,Recorded At\n";
    const blob = new Blob([header + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rci-analysis-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    
    toast({ title: "Data Exported", description: "CSV file downloaded successfully" });
  };

  // Prepare chart data
  const trendData = rciHistory.slice(-50).map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString(),
    rci: h.rci_score,
    land: h.land_capacity || 0,
    ocean: h.ocean_capacity || 0,
    human: h.human_capacity || 0,
    circular: h.circular_capacity || 0,
  }));

  const correlationData = rciHistory.map((h) => ({
    land: h.land_capacity || 0,
    ocean: h.ocean_capacity || 0,
    human: h.human_capacity || 0,
    circular: h.circular_capacity || 0,
    rci: h.rci_score,
  }));

  const averageCapacities = {
    land: rciHistory.reduce((sum, h) => sum + (h.land_capacity || 0), 0) / (rciHistory.length || 1),
    ocean: rciHistory.reduce((sum, h) => sum + (h.ocean_capacity || 0), 0) / (rciHistory.length || 1),
    human: rciHistory.reduce((sum, h) => sum + (h.human_capacity || 0), 0) / (rciHistory.length || 1),
    circular: rciHistory.reduce((sum, h) => sum + (h.circular_capacity || 0), 0) / (rciHistory.length || 1),
  };

  const radarData = [
    { subject: "Land", value: averageCapacities.land, fullMark: 100 },
    { subject: "Ocean", value: averageCapacities.ocean, fullMark: 100 },
    { subject: "Human", value: averageCapacities.human, fullMark: 100 },
    { subject: "Circular", value: averageCapacities.circular, fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="glass-strong border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by region" />
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
              </div>

              <div className="flex gap-1">
                <Button
                  variant={analysisType === "trend" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAnalysisType("trend")}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Trend
                </Button>
                <Button
                  variant={analysisType === "correlation" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAnalysisType("correlation")}
                >
                  <Activity className="w-4 h-4 mr-1" />
                  Correlation
                </Button>
                <Button
                  variant={analysisType === "capacity" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAnalysisType("capacity")}
                >
                  <Layers className="w-4 h-4 mr-1" />
                  Capacity
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {isLoading ? (
        <Card className="glass-strong border-border/50">
          <CardContent className="py-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Chart */}
          <Card className="glass-strong border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {analysisType === "trend" && "RCI Historical Trend Analysis"}
                {analysisType === "correlation" && "Capacity Correlation Analysis"}
                {analysisType === "capacity" && "Capacity Distribution Analysis"}
              </CardTitle>
              <CardDescription>
                {rciHistory.length} data points analyzed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {analysisType === "trend" ? (
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="rci" name="RCI Score" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="land" name="Land" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="ocean" name="Ocean" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="human" name="Human" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="circular" name="Circular" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  ) : analysisType === "correlation" ? (
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" dataKey="land" name="Land Capacity" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis type="number" dataKey="ocean" name="Ocean Capacity" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Scatter name="Regions" data={correlationData} fill="hsl(var(--primary))" />
                    </ScatterChart>
                  ) : (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <PolarRadiusAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Radar name="Average Capacity" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="glass-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Statistical Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Average RCI</p>
                    <p className="text-2xl font-bold text-primary">
                      {(rciHistory.reduce((sum, h) => sum + h.rci_score, 0) / (rciHistory.length || 1)).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Std Deviation</p>
                    <p className="text-2xl font-bold text-foreground">
                      {(() => {
                        const avg = rciHistory.reduce((sum, h) => sum + h.rci_score, 0) / (rciHistory.length || 1);
                        const variance = rciHistory.reduce((sum, h) => sum + Math.pow(h.rci_score - avg, 2), 0) / (rciHistory.length || 1);
                        return Math.sqrt(variance).toFixed(2);
                      })()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Max RCI</p>
                    <p className="text-2xl font-bold text-emerald-500">
                      {Math.max(...rciHistory.map((h) => h.rci_score), 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Min RCI</p>
                    <p className="text-2xl font-bold text-amber-500">
                      {rciHistory.length > 0 ? Math.min(...rciHistory.map((h) => h.rci_score)).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity Breakdown */}
          <Card className="glass-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Average Capacities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(averageCapacities).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key}</span>
                      <span className="font-mono text-sm">{value.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DataAnalysisTools;
