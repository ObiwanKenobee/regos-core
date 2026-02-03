import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import {
  Microscope,
  Database,
  TrendingUp,
  Upload,
  ArrowLeft,
  RefreshCw,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  BarChart3,
  Activity,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

interface DataSource {
  id: string;
  name: string;
  source_type: string;
  data_type: string | null;
  status: string;
  last_sync: string | null;
  region_name?: string;
}

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

const ScientistDashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [rciHistory, setRciHistory] = useState<RCIHistory[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [view, setView] = useState<"overview" | "data" | "research">("overview");
  const [isSubmittingData, setIsSubmittingData] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [newSubmission, setNewSubmission] = useState({
    region_id: "",
    data_type: "",
    description: "",
    evidence_urls: "",
  });

  const isScientist = roles.includes("scientist") || roles.includes("admin");

  const {
    paginatedData: paginatedHistory,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    startIndex,
    endIndex,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
  } = usePagination({ data: rciHistory, itemsPerPage: 10 });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && !isScientist) {
      toast({
        title: "Access Denied",
        description: "You need scientist privileges to access this dashboard.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, roles, loading, navigate, isScientist]);

  useEffect(() => {
    if (isScientist && user) {
      fetchData();
    }
  }, [isScientist, user]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch data sources
      const { data: sources, error: sourcesError } = await supabase
        .from("data_sources")
        .select(`
          id,
          name,
          source_type,
          data_type,
          status,
          last_sync,
          region:rci_regions(region_name)
        `)
        .order("name");

      if (sourcesError) throw sourcesError;

      const formattedSources: DataSource[] = (sources || []).map((s: any) => ({
        ...s,
        region_name: s.region?.region_name || "Global",
      }));

      setDataSources(formattedSources);

      // Fetch RCI history
      const { data: history, error: historyError } = await supabase
        .from("rci_history")
        .select(`
          *,
          region:rci_regions(region_name)
        `)
        .order("recorded_at", { ascending: false })
        .limit(100);

      if (historyError) throw historyError;

      const formattedHistory: RCIHistory[] = (history || []).map((h: any) => ({
        ...h,
        region_name: h.region?.region_name || "Unknown",
      }));

      setRciHistory(formattedHistory);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmitData = async () => {
    if (!newSubmission.region_id || !newSubmission.data_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingData(true);
    try {
      const { error } = await supabase.from("verification_requests").insert({
        region_id: newSubmission.region_id,
        credit_type: newSubmission.data_type,
        credit_amount: 0,
        description: newSubmission.description,
        evidence_urls: newSubmission.evidence_urls ? newSubmission.evidence_urls.split(",").map((u) => u.trim()) : [],
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Data Submitted",
        description: "Your research data has been submitted for verification.",
      });

      setShowSubmitDialog(false);
      setNewSubmission({ region_id: "", data_type: "", description: "", evidence_urls: "" });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingData(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        );
    }
  };

  // Prepare chart data
  const chartData = rciHistory
    .slice(0, 30)
    .reverse()
    .map((h) => ({
      date: new Date(h.recorded_at).toLocaleDateString(),
      rci: h.rci_score,
      land: h.land_capacity || 0,
      ocean: h.ocean_capacity || 0,
      human: h.human_capacity || 0,
      circular: h.circular_capacity || 0,
    }));

  const correlationData = rciHistory.slice(0, 50).map((h) => ({
    land: h.land_capacity || 0,
    ocean: h.ocean_capacity || 0,
    rci: h.rci_score,
  }));

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isScientist) {
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
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Microscope className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">
                    Research Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Analyze RCI data and submit research findings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader>
                      <DialogTitle>Submit Research Data</DialogTitle>
                      <DialogDescription>
                        Submit new research findings for verification.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="region">Region</Label>
                        <Select
                          value={newSubmission.region_id}
                          onValueChange={(v) => setNewSubmission({ ...newSubmission, region_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            {dataSources
                              .filter((d, i, arr) => arr.findIndex((x) => x.region_name === d.region_name) === i)
                              .map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.region_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="type">Data Type</Label>
                        <Select
                          value={newSubmission.data_type}
                          onValueChange={(v) => setNewSubmission({ ...newSubmission, data_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="land">Land Capacity</SelectItem>
                            <SelectItem value="ocean">Ocean Capacity</SelectItem>
                            <SelectItem value="health">Human Health</SelectItem>
                            <SelectItem value="circular">Circular Economy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newSubmission.description}
                          onChange={(e) => setNewSubmission({ ...newSubmission, description: e.target.value })}
                          placeholder="Describe your research findings..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="evidence">Evidence URLs (comma-separated)</Label>
                        <Input
                          id="evidence"
                          value={newSubmission.evidence_urls}
                          onChange={(e) => setNewSubmission({ ...newSubmission, evidence_urls: e.target.value })}
                          placeholder="https://paper1.pdf, https://paper2.pdf"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmitData} disabled={isSubmittingData}>
                        {isSubmittingData ? "Submitting..." : "Submit"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </motion.div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={view === "overview" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("overview")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={view === "data" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("data")}
            >
              <Database className="w-4 h-4 mr-2" />
              Data Sources
            </Button>
            <Button
              variant={view === "research" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("research")}
            >
              <Activity className="w-4 h-4 mr-2" />
              Research Tools
            </Button>
          </div>

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
                  <Database className="w-4 h-4" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-foreground">
                  {dataSources.length}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Active Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  {dataSources.filter((d) => d.status === "active").length}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Data Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-foreground">
                  {rciHistory.length}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Avg RCI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  {rciHistory.length > 0
                    ? (rciHistory.reduce((sum, h) => sum + h.rci_score, 0) / rciHistory.length).toFixed(1)
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {view === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RCI Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>RCI Historical Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
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
                          <Line type="monotone" dataKey="rci" name="RCI Score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="land" name="Land" stroke="#22c55e" strokeWidth={1} dot={false} />
                          <Line type="monotone" dataKey="ocean" name="Ocean" stroke="#3b82f6" strokeWidth={1} dot={false} />
                          <Line type="monotone" dataKey="human" name="Human" stroke="#f43f5e" strokeWidth={1} dot={false} />
                          <Line type="monotone" dataKey="circular" name="Circular" stroke="#a855f7" strokeWidth={1} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Correlation Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Land vs Ocean Correlation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            type="number"
                            dataKey="land"
                            name="Land Capacity"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                          />
                          <YAxis
                            type="number"
                            dataKey="ocean"
                            name="Ocean Capacity"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                          />
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
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Recent Data Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {rciHistory.slice(0, 10).map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                        >
                          <div>
                            <p className="font-medium text-foreground">{h.region_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(h.recorded_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="font-mono">
                            {h.rci_score.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {view === "data" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-strong border-border/50">
                <CardHeader>
                  <CardTitle>Connected Data Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Data Type</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Sync</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataSources.map((source) => (
                          <TableRow key={source.id}>
                            <TableCell className="font-medium">{source.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{source.source_type}</Badge>
                            </TableCell>
                            <TableCell className="capitalize">{source.data_type || "Mixed"}</TableCell>
                            <TableCell>{source.region_name}</TableCell>
                            <TableCell>{getStatusBadge(source.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {source.last_sync
                                ? new Date(source.last_sync).toLocaleString()
                                : "Never"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {view === "research" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-strong border-border/50">
                <CardHeader>
                  <CardTitle>RCI History Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Region</TableHead>
                          <TableHead>RCI Score</TableHead>
                          <TableHead>Land</TableHead>
                          <TableHead>Ocean</TableHead>
                          <TableHead>Human</TableHead>
                          <TableHead>Circular</TableHead>
                          <TableHead>Recorded</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedHistory.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="font-medium">{h.region_name}</TableCell>
                            <TableCell className="font-mono text-primary">
                              {h.rci_score.toFixed(1)}%
                            </TableCell>
                            <TableCell className="font-mono">
                              {h.land_capacity?.toFixed(1) || "—"}%
                            </TableCell>
                            <TableCell className="font-mono">
                              {h.ocean_capacity?.toFixed(1) || "—"}%
                            </TableCell>
                            <TableCell className="font-mono">
                              {h.human_capacity?.toFixed(1) || "—"}%
                            </TableCell>
                            <TableCell className="font-mono">
                              {h.circular_capacity?.toFixed(1) || "—"}%
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(h.recorded_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    onNextPage={nextPage}
                    onPrevPage={prevPage}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScientistDashboard;
