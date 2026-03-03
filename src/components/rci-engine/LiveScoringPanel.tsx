import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Zap, Globe, TrendingUp, TrendingDown, Minus,
  RefreshCw, Radio, Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RegionScore {
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

const trendIcon = {
  improving: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
};

const trendColor = {
  improving: "text-emerald-400",
  declining: "text-red-400",
  stable: "text-amber-400",
};

const LiveScoringPanel = () => {
  const [regions, setRegions] = useState<RegionScore[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    fetchRegions();

    const channel = supabase
      .channel("live-rci-scoring")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rci_regions" },
        (payload) => {
          setIsLive(true);
          setLastEvent(new Date().toISOString());
          setEventCount((c) => c + 1);
          setRegions((prev) =>
            prev.map((r) =>
              r.id === (payload.new as RegionScore).id
                ? (payload.new as RegionScore)
                : r
            )
          );
          setTimeout(() => setIsLive(false), 3000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRegions = async () => {
    const { data } = await supabase
      .from("rci_regions")
      .select("*")
      .order("rci_score", { ascending: false });
    if (data) setRegions(data);
  };

  const avgScore = regions.length > 0
    ? (regions.reduce((s, r) => s + r.rci_score, 0) / regions.length).toFixed(1)
    : "0";

  const improving = regions.filter((r) => r.rci_trend === "improving").length;
  const declining = regions.filter((r) => r.rci_trend === "declining").length;

  return (
    <div className="space-y-6">
      {/* Live Status Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isLive ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Radio className={`w-5 h-5 ${isLive ? "text-emerald-400" : "text-muted-foreground"}`} />
          </motion.div>
          <div>
            <p className="font-medium text-sm">
              {isLive ? "Live Data Incoming" : "Listening for Updates"}
            </p>
            <p className="text-xs text-muted-foreground">
              {lastEvent
                ? `Last event: ${formatDistanceToNow(new Date(lastEvent), { addSuffix: true })}`
                : "No events received yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Zap className="w-3 h-3" />
            {eventCount} events
          </Badge>
          <Badge variant={isLive ? "default" : "secondary"} className="gap-1">
            <Activity className="w-3 h-3" />
            {isLive ? "LIVE" : "IDLE"}
          </Badge>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <Globe className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{regions.length}</p>
            <p className="text-xs text-muted-foreground">Active Regions</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <Activity className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{avgScore}%</p>
            <p className="text-xs text-muted-foreground">Global Avg RCI</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold">{improving}</p>
            <p className="text-xs text-muted-foreground">Improving</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <TrendingDown className="w-5 h-5 text-red-400 mb-2" />
            <p className="text-2xl font-bold">{declining}</p>
            <p className="text-xs text-muted-foreground">Declining</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Region Scores */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Live RCI Scores
          </CardTitle>
          <CardDescription>Real-time capacity scores across all monitored regions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {regions.map((region) => {
              const trend = region.rci_trend || "stable";
              const TrendIcon = trendIcon[trend as keyof typeof trendIcon] || Minus;
              const color = trendColor[trend as keyof typeof trendColor] || "text-muted-foreground";
              return (
                <motion.div
                  key={region.id}
                  layout
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20 border border-border/30"
                >
                  <div className="w-24 shrink-0">
                    <p className="font-medium text-sm truncate">{region.region_name}</p>
                    <p className="text-xs text-muted-foreground">{region.region_code}</p>
                  </div>
                  <div className="flex-1">
                    <Progress value={region.rci_score} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2 w-20 justify-end">
                    <span className="font-mono font-bold text-sm">{region.rci_score.toFixed(1)}%</span>
                    <TrendIcon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="hidden md:block w-48">
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: "L", value: region.land_capacity, color: "bg-green-400" },
                        { label: "O", value: region.ocean_capacity, color: "bg-blue-400" },
                        { label: "H", value: region.human_capacity, color: "bg-rose-400" },
                        { label: "C", value: region.circular_capacity, color: "bg-purple-400" },
                      ].map((cap) => (
                        <div key={cap.label} className="text-center">
                          <div className="h-1 rounded-full bg-secondary mb-1">
                            <div
                              className={`h-full rounded-full ${cap.color}`}
                              style={{ width: `${cap.value || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{cap.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="hidden lg:block text-xs text-muted-foreground w-24 text-right">
                    {region.last_updated
                      ? formatDistanceToNow(new Date(region.last_updated), { addSuffix: true })
                      : "—"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveScoringPanel;
