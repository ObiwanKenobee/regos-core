import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Database, RefreshCw, CheckCircle, XCircle, Clock, Satellite,
  Waves, Activity as ActivityIcon, Cpu, Play,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const sourceTypeIcons: Record<string, React.ElementType> = {
  sensor: Cpu,
  satellite: Satellite,
  partner_api: Waves,
  manual: ActivityIcon,
};

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  active: { color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  inactive: { color: "bg-slate-500/20 text-slate-400", icon: Clock },
  error: { color: "bg-red-500/20 text-red-400", icon: XCircle },
};

const DataIngestionMonitor = () => {
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const { data: sources = [], isLoading, refetch } = useQuery({
    queryKey: ["data-sources-monitor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_sources")
        .select("*, region:rci_regions(region_name, region_code)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: recentAnalytics = [] } = useQuery({
    queryKey: ["recent-ingestion-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sovereign_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const handleManualSync = async (sourceId: string) => {
    setIsSyncing(sourceId);
    try {
      await supabase.functions.invoke("sync-data-sources", {
        body: { source_id: sourceId },
      });
      toast({ title: "Sync triggered", description: "Data source sync has been initiated." });
      await refetch();
    } catch (error: any) {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSyncing(null);
    }
  };

  const activeSources = sources.filter((s: any) => s.status === "active").length;
  const autoSyncEnabled = sources.filter((s: any) => s.auto_sync_enabled).length;

  return (
    <div className="space-y-6">
      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <Database className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{sources.length}</p>
            <p className="text-xs text-muted-foreground">Total Sources</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <CheckCircle className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold">{activeSources}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <RefreshCw className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{autoSyncEnabled}</p>
            <p className="text-xs text-muted-foreground">Auto-Sync</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <ActivityIcon className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-2xl font-bold">{recentAnalytics.length}</p>
            <p className="text-xs text-muted-foreground">Recent Events</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources Table */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Data Source Pipeline
          </CardTitle>
          <CardDescription>Monitor and manage live data ingestion endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Auto</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source: any) => {
                  const SourceIcon = sourceTypeIcons[source.source_type] || Database;
                  const status = statusConfig[source.status] || statusConfig.inactive;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <SourceIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{source.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{source.source_type}</Badge>
                      </TableCell>
                      <TableCell>{source.region?.region_name || "Global"}</TableCell>
                      <TableCell>
                        <Badge className={`${status.color} gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {source.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {source.last_sync
                          ? formatDistanceToNow(new Date(source.last_sync), { addSuffix: true })
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {source.auto_sync_enabled ? (
                          <Badge variant="secondary" className="text-xs">
                            Every {source.sync_interval_minutes}m
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Off</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManualSync(source.id)}
                          disabled={isSyncing === source.id}
                        >
                          {isSyncing === source.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Ingestion Events */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Ingestion Events</CardTitle>
          <CardDescription>Latest data points processed by the pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recentAnalytics.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/20"
              >
                <div className="flex items-center gap-3">
                  <ActivityIcon className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{event.metric_type}</p>
                    <p className="text-xs text-muted-foreground">
                      Value: {Number(event.metric_value).toFixed(1)}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
            {recentAnalytics.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No recent events</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataIngestionMonitor;
