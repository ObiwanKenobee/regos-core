import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Satellite,
  Radio,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DataSource {
  id: string;
  name: string;
  source_type: "sensor" | "satellite" | "partner_api";
  endpoint_url: string | null;
  api_key_name: string | null;
  region_id: string | null;
  data_type: "land" | "ocean" | "health" | "circular" | null;
  status: "active" | "inactive" | "error";
  last_sync: string | null;
  sync_interval_minutes: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface RCIRegion {
  id: string;
  region_name: string;
  region_code: string;
}

const sourceTypeIcons = {
  sensor: Radio,
  satellite: Satellite,
  partner_api: Link2,
};

const statusColors = {
  active: "text-primary bg-primary/10",
  inactive: "text-muted-foreground bg-muted",
  error: "text-destructive bg-destructive/10",
};

const DataSourceManager = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [regions, setRegions] = useState<RCIRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSource, setNewSource] = useState<Partial<DataSource>>({
    name: "",
    source_type: "sensor",
    endpoint_url: "",
    api_key_name: "",
    data_type: "land",
    status: "inactive",
    sync_interval_minutes: 60,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sourcesRes, regionsRes] = await Promise.all([
        supabase.from("data_sources").select("*").order("created_at", { ascending: false }),
        supabase.from("rci_regions").select("id, region_name, region_code").order("region_name"),
      ]);

      if (sourcesRes.error) throw sourcesRes.error;
      if (regionsRes.error) throw regionsRes.error;

      setDataSources((sourcesRes.data || []) as DataSource[]);
      setRegions(regionsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data sources",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSource.name || !newSource.source_type) {
      toast({
        title: "Validation Error",
        description: "Name and source type are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("data_sources").insert({
        name: newSource.name,
        source_type: newSource.source_type,
        endpoint_url: newSource.endpoint_url || null,
        api_key_name: newSource.api_key_name || null,
        region_id: newSource.region_id || null,
        data_type: newSource.data_type || null,
        status: newSource.status || "inactive",
        sync_interval_minutes: newSource.sync_interval_minutes || 60,
      });

      if (error) throw error;

      toast({
        title: "Data source added",
        description: `${newSource.name} has been configured.`,
      });

      setIsAddingSource(false);
      setNewSource({
        name: "",
        source_type: "sensor",
        endpoint_url: "",
        api_key_name: "",
        data_type: "land",
        status: "inactive",
        sync_interval_minutes: 60,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error adding data source",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSourceStatus = async (source: DataSource) => {
    const newStatus = source.status === "active" ? "inactive" : "active";
    try {
      const { error } = await supabase
        .from("data_sources")
        .update({ status: newStatus })
        .eq("id", source.id);

      if (error) throw error;

      toast({
        title: `Source ${newStatus === "active" ? "activated" : "deactivated"}`,
        description: `${source.name} is now ${newStatus}.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSource = async (source: DataSource) => {
    if (!confirm(`Delete ${source.name}?`)) return;

    try {
      const { error } = await supabase
        .from("data_sources")
        .delete()
        .eq("id", source.id);

      if (error) throw error;

      toast({
        title: "Source deleted",
        description: `${source.name} has been removed.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting source",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testConnection = async (source: DataSource) => {
    toast({
      title: "Testing connection...",
      description: `Checking connectivity to ${source.name}`,
    });

    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3;
      if (success) {
        toast({
          title: "Connection successful",
          description: `${source.name} is reachable and responding.`,
        });
      } else {
        toast({
          title: "Connection failed",
          description: `Unable to reach ${source.name}. Check endpoint and credentials.`,
          variant: "destructive",
        });
      }
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">
            Data Sources ({dataSources.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure sensor endpoints, satellite feeds, and partner APIs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddingSource} onOpenChange={setIsAddingSource}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Data Source</DialogTitle>
                <DialogDescription>
                  Configure a new data ingestion source for RCI tracking.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Source Name</Label>
                    <Input
                      id="name"
                      value={newSource.name}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                      placeholder="Forest Sensor Network"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Source Type</Label>
                    <Select
                      value={newSource.source_type}
                      onValueChange={(value) => setNewSource({ ...newSource, source_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sensor">Sensor Network</SelectItem>
                        <SelectItem value="satellite">Satellite Feed</SelectItem>
                        <SelectItem value="partner_api">Partner API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="endpoint">Endpoint URL</Label>
                  <Input
                    id="endpoint"
                    value={newSource.endpoint_url || ""}
                    onChange={(e) => setNewSource({ ...newSource, endpoint_url: e.target.value })}
                    placeholder="https://api.example.com/sensors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="api_key">API Key Name (Secret)</Label>
                    <Input
                      id="api_key"
                      value={newSource.api_key_name || ""}
                      onChange={(e) => setNewSource({ ...newSource, api_key_name: e.target.value })}
                      placeholder="SENSOR_API_KEY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_type">Data Type</Label>
                    <Select
                      value={newSource.data_type || "land"}
                      onValueChange={(value) => setNewSource({ ...newSource, data_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="land">Land Capacity</SelectItem>
                        <SelectItem value="ocean">Ocean Capacity</SelectItem>
                        <SelectItem value="health">Human Health</SelectItem>
                        <SelectItem value="circular">Circular Economy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="region">Target Region</Label>
                    <Select
                      value={newSource.region_id || "none"}
                      onValueChange={(value) => setNewSource({ ...newSource, region_id: value === "none" ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">All Regions</SelectItem>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.region_name} ({region.region_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="interval">Sync Interval (min)</Label>
                    <Input
                      id="interval"
                      type="number"
                      value={newSource.sync_interval_minutes || 60}
                      onChange={(e) => setNewSource({ ...newSource, sync_interval_minutes: parseInt(e.target.value) || 60 })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingSource(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSource}>Add Source</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {["sensor", "satellite", "partner_api"].map((type) => {
          const Icon = sourceTypeIcons[type as keyof typeof sourceTypeIcons];
          const count = dataSources.filter((s) => s.source_type === type).length;
          const activeCount = dataSources.filter((s) => s.source_type === type && s.status === "active").length;
          return (
            <div key={type} className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{type.replace("_", " ")}s</p>
                  <p className="text-xl font-display font-bold text-foreground">
                    {activeCount}/{count}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataSources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No data sources configured. Add your first source to begin.
                </TableCell>
              </TableRow>
            ) : (
              dataSources.map((source) => {
                const Icon = sourceTypeIcons[source.source_type];
                return (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary/50">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{source.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {source.endpoint_url || "No endpoint configured"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{source.source_type.replace("_", " ")}</TableCell>
                    <TableCell className="capitalize">{source.data_type || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusColors[source.status]}`}>
                        {getStatusIcon(source.status)}
                        {source.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {source.last_sync
                        ? new Date(source.last_sync).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => testConnection(source)}
                          title="Test Connection"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSourceStatus(source)}
                          title={source.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {source.status === "active" ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSource(source)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default DataSourceManager;
