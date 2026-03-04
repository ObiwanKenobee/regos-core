import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, FlaskConical, Upload, BookOpen, Activity,
  BarChart3, CheckCircle, Clock, AlertCircle, Layers, Database,
} from "lucide-react";
import {
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { RoleDashboardHeader } from "@/components/dashboard/RoleDashboardHeader";
import { ResearchSubmission, MethodologyContributions, DataAnalysisTools } from "@/components/scientist";

interface Region {
  id: string;
  region_name: string;
  region_code: string;
  rci_score: number;
  land_capacity: number | null;
  ocean_capacity: number | null;
  human_capacity: number | null;
  circular_capacity: number | null;
}

interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "research", label: "Submit Research", icon: Upload },
  { id: "contributions", label: "Contributions", icon: BookOpen },
  { id: "analysis", label: "Data Analysis", icon: Activity },
];

const ScientistDashboard = () => {
  const { user, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<Region[]>([]);
  const [submissionStats, setSubmissionStats] = useState<SubmissionStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [rciHistory, setRciHistory] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const isScientist = roles.includes("scientist") || roles.includes("admin");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && !isScientist) {
      toast({ title: "Access Denied", description: "Scientist privileges required.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [user, roles, loading, navigate, isScientist]);

  useEffect(() => {
    if (isScientist && user) {
      fetchData();
      const channel = supabase
        .channel("scientist-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "verification_requests" }, () => fetchData())
        .on("postgres_changes", { event: "*", schema: "public", table: "rci_regions" }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isScientist, user]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [regionsRes, statsRes, historyRes] = await Promise.all([
        supabase.from("rci_regions").select("id, region_name, region_code, rci_score, land_capacity, ocean_capacity, human_capacity, circular_capacity").order("region_name"),
        supabase.from("verification_requests").select("status"),
        supabase.from("rci_history").select("rci_score, land_capacity, ocean_capacity, human_capacity, circular_capacity, recorded_at, region:rci_regions(region_name)")
          .order("recorded_at", { ascending: true }).limit(200),
      ]);
      if (regionsRes.error) throw regionsRes.error;
      setRegions(regionsRes.data || []);

      const allStats = statsRes.data || [];
      setSubmissionStats({
        total: allStats.length,
        pending: allStats.filter((s: any) => s.status === "pending").length,
        approved: allStats.filter((s: any) => s.status === "approved").length,
        rejected: allStats.filter((s: any) => s.status === "rejected").length,
      });

      setRciHistory(historyRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!isScientist) return null;

  // Compute overview data
  const avgRCI = regions.length ? (regions.reduce((s, r) => s + r.rci_score, 0) / regions.length) : 0;
  const avgCapacities = {
    land: regions.reduce((s, r) => s + (r.land_capacity || 0), 0) / (regions.length || 1),
    ocean: regions.reduce((s, r) => s + (r.ocean_capacity || 0), 0) / (regions.length || 1),
    human: regions.reduce((s, r) => s + (r.human_capacity || 0), 0) / (regions.length || 1),
    circular: regions.reduce((s, r) => s + (r.circular_capacity || 0), 0) / (regions.length || 1),
  };
  const radarData = [
    { subject: "Land", value: avgCapacities.land, fullMark: 100 },
    { subject: "Ocean", value: avgCapacities.ocean, fullMark: 100 },
    { subject: "Human", value: avgCapacities.human, fullMark: 100 },
    { subject: "Circular", value: avgCapacities.circular, fullMark: 100 },
  ];

  const trendData = rciHistory.slice(-60).map((h: any) => ({
    date: format(new Date(h.recorded_at), "MMM d"),
    rci: h.rci_score,
    land: h.land_capacity || 0,
    ocean: h.ocean_capacity || 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <RoleDashboardHeader
        userEmail={user?.email || ""}
        roles={roles}
        currentRole="scientist"
        isRealtimeActive={!isLoadingData}
        onSignOut={async () => { await signOut(); navigate("/auth"); }}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="Research Lab"
        accentColor="from-sky-500 to-blue-600"
        accentIcon={FlaskConical}
      />

      <main className="container px-4 md:px-6 py-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: "Regions Analyzed", value: regions.length.toString(), icon: Database },
            { label: "Global Avg RCI", value: `${avgRCI.toFixed(1)}%`, icon: BarChart3, accent: true },
            { label: "Total Submissions", value: submissionStats.total.toString(), icon: Upload },
            { label: "Pending Review", value: submissionStats.pending.toString(), icon: Clock },
            { label: "Approved", value: submissionStats.approved.toString(), icon: CheckCircle, accent: true },
            { label: "Rejected", value: submissionStats.rejected.toString(), icon: AlertCircle },
          ].map((kpi) => (
            <Card key={kpi.label} className="glass-strong border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`w-4 h-4 ${kpi.accent ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className={`text-2xl font-display font-bold ${kpi.accent ? "text-primary" : "text-foreground"}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radar */}
              <Card className="glass-strong border-border/50">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Global Capacity Profile</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <PolarRadiusAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Radar name="Avg Capacity" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Trend line */}
              <Card className="glass-strong border-border/50 lg:col-span-2">
                <CardHeader><CardTitle className="text-sm">RCI Historical Trend</CardTitle><CardDescription>{trendData.length} data points</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Legend />
                        <Line type="monotone" dataKey="rci" name="RCI" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="land" name="Land" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="ocean" name="Ocean" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Submission pipeline */}
              <Card className="glass-strong border-border/50 lg:col-span-3">
                <CardHeader><CardTitle className="text-sm">Verification Pipeline</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: "Pending Review", count: submissionStats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
                      { label: "Verified & Contributing", count: submissionStats.approved, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                      { label: "Needs Revision", count: submissionStats.rejected, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
                    ].map((s) => (
                      <div key={s.label} className="p-5 rounded-xl border border-border bg-secondary/20 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
                        <div>
                          <p className="text-3xl font-display font-bold text-foreground">{s.count}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "research" && (
            <ResearchSubmission regions={regions.map(r => ({ id: r.id, region_name: r.region_name, region_code: r.region_code }))} userId={user?.id || ""} onSubmissionComplete={fetchData} />
          )}

          {activeTab === "contributions" && <MethodologyContributions />}

          {activeTab === "analysis" && <DataAnalysisTools />}
        </motion.div>
      </main>
    </div>
  );
};

export default ScientistDashboard;
