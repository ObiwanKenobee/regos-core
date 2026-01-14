import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Crown,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Zap,
  Leaf,
  Waves,
  Users,
  Recycle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import NotificationCenter from "@/components/NotificationCenter";

interface RCIRegion {
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

interface VerificationRequest {
  id: string;
  credit_type: string;
  credit_amount: number;
  status: string;
  description: string | null;
  required_signatures: number;
  created_at: string;
  region: {
    region_name: string;
    region_code: string;
  } | null;
  signatures_count?: number;
}

const SovereignDashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<RCIRegion[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const isSovereign = roles.includes("sovereign") || roles.includes("admin");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && !isSovereign) {
      toast({
        title: "Access Denied",
        description: "You need sovereign privileges to access this dashboard.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, roles, loading, navigate, isSovereign]);

  useEffect(() => {
    if (isSovereign && user) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [isSovereign, user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("rci-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rci_regions" },
        (payload) => {
          console.log("RCI Update:", payload);
          if (payload.eventType === "UPDATE") {
            setRegions((prev) =>
              prev.map((r) =>
                r.id === (payload.new as RCIRegion).id
                  ? (payload.new as RCIRegion)
                  : r
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_requests" },
        () => {
          fetchVerificationRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async () => {
    setIsLoadingData(true);
    await Promise.all([fetchRegions(), fetchVerificationRequests()]);
    setIsLoadingData(false);
  };

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("rci_regions")
        .select("*")
        .order("rci_score", { ascending: false });

      if (error) throw error;
      setRegions(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching regions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchVerificationRequests = async () => {
    try {
      const { data: requests, error } = await supabase
        .from("verification_requests")
        .select(`
          *,
          region:rci_regions(region_name, region_code)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get signature counts for each request
      const requestsWithCounts = await Promise.all(
        (requests || []).map(async (req) => {
          const { count } = await supabase
            .from("verification_signatures")
            .select("*", { count: "exact", head: true })
            .eq("request_id", req.id);

          return {
            ...req,
            signatures_count: count || 0,
          };
        })
      );

      setVerificationRequests(requestsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error fetching verification requests",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSyncDataSources = async () => {
    setIsSyncing(true);
    try {
      const { data: dataSources, error: dsError } = await supabase
        .from("data_sources")
        .select("*")
        .eq("status", "active");

      if (dsError) throw dsError;

      if (!dataSources || dataSources.length === 0) {
        toast({
          title: "No Active Data Sources",
          description: "Configure data sources in the Admin panel first.",
          variant: "destructive",
        });
        return;
      }

      // Trigger sync for each active data source
      const syncResults = await Promise.all(
        dataSources.map(async (ds) => {
          try {
            // In production, this would call the actual endpoints
            // For now, we'll simulate with mock data
            const mockData = {
              source: ds.source_type as "sensor" | "satellite" | "partner_api",
              region_code: ds.region_id ? "GLOBAL" : "US",
              data_type: (ds.data_type || "land") as "land" | "ocean" | "health" | "circular",
              value: Math.random() * 100,
              timestamp: new Date().toISOString(),
              metadata: { source_id: ds.id, source_name: ds.name },
            };

            const response = await supabase.functions.invoke("rci-data-ingestion", {
              body: { data: mockData },
            });

            if (response.error) throw response.error;

            // Update last_sync timestamp
            await supabase
              .from("data_sources")
              .update({ last_sync: new Date().toISOString() })
              .eq("id", ds.id);

            return { source: ds.name, success: true };
          } catch (err: any) {
            return { source: ds.name, success: false, error: err.message };
          }
        })
      );

      const successCount = syncResults.filter((r) => r.success).length;
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${successCount}/${dataSources.length} data sources.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getCapacityColor = (value: number | null): string => {
    if (value === null) return "bg-muted";
    if (value >= 70) return "bg-primary";
    if (value >= 40) return "bg-amber-500";
    return "bg-destructive";
  };

  const averageRCI = regions.length
    ? regions.reduce((acc, r) => acc + r.rci_score, 0) / regions.length
    : 0;

  const pendingRequests = verificationRequests.filter(
    (r) => r.status === "pending"
  ).length;

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSovereign) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-warm/10">
                  <Crown className="w-6 h-6 text-amber-warm" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">
                    Sovereign Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Real-time RCI metrics and verification tracking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncDataSources}
                  disabled={isSyncing}
                >
                  <Zap className={`w-4 h-4 mr-2 ${isSyncing ? "animate-pulse" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Data Sources"}
                </Button>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Total Regions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-foreground">
                  {regions.length}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Average RCI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  {averageRCI.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-amber-warm">
                  {pendingRequests}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approved This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  {
                    verificationRequests.filter(
                      (r) =>
                        r.status === "approved" &&
                        new Date(r.created_at).getMonth() === new Date().getMonth()
                    ).length
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RCI Regions Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-strong border-border/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Regional RCI Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {regions.slice(0, 8).map((region) => (
                      <div
                        key={region.id}
                        className="p-4 rounded-lg bg-secondary/30 border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {region.region_code}
                            </span>
                            <span className="font-medium text-foreground">
                              {region.region_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(region.rci_trend)}
                            <span className="font-display font-bold text-lg text-primary">
                              {region.rci_score.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center">
                            <Leaf className="w-4 h-4 mx-auto text-primary mb-1" />
                            <Progress
                              value={region.land_capacity || 0}
                              className="h-1.5"
                            />
                            <span className="text-xs text-muted-foreground">
                              {region.land_capacity?.toFixed(0) || 0}%
                            </span>
                          </div>
                          <div className="text-center">
                            <Waves className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                            <Progress
                              value={region.ocean_capacity || 0}
                              className="h-1.5"
                            />
                            <span className="text-xs text-muted-foreground">
                              {region.ocean_capacity?.toFixed(0) || 0}%
                            </span>
                          </div>
                          <div className="text-center">
                            <Users className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                            <Progress
                              value={region.human_capacity || 0}
                              className="h-1.5"
                            />
                            <span className="text-xs text-muted-foreground">
                              {region.human_capacity?.toFixed(0) || 0}%
                            </span>
                          </div>
                          <div className="text-center">
                            <Recycle className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                            <Progress
                              value={region.circular_capacity || 0}
                              className="h-1.5"
                            />
                            <span className="text-xs text-muted-foreground">
                              {region.circular_capacity?.toFixed(0) || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Verification Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-strong border-border/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Verification Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/30">
                          <TableHead>Region</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Signatures</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verificationRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-secondary/20">
                            <TableCell>
                              <span className="font-mono text-xs">
                                {request.region?.region_code || "N/A"}
                              </span>
                            </TableCell>
                            <TableCell className="capitalize">
                              {request.credit_type.replace("_", " ")}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {request.credit_amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="text-sm">
                                  {request.signatures_count}/{request.required_signatures}
                                </span>
                                <Progress
                                  value={
                                    (request.signatures_count! /
                                      request.required_signatures) *
                                    100
                                  }
                                  className="w-12 h-1.5"
                                />
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                          </TableRow>
                        ))}
                        {verificationRequests.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground py-8"
                            >
                              No verification requests found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SovereignDashboard;
