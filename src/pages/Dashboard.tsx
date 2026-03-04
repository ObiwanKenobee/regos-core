import { useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData, useChartData } from "@/hooks/useDashboardData";
import { exportRCIRegionsToCSV } from "@/utils/exportData";
import {
  AlertCircle, Crown, TrendingUp, FlaskConical, Users, Shield, Globe,
  Store, CheckCircle, Cpu, Banknote, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  DashboardHeader,
  DashboardStats,
  DashboardToolbar,
  RegionalRankings,
  RegionsDataTable,
  RCITrendChart,
  CapacityBreakdown,
  SectorTrendsChart,
} from "@/components/dashboard";

const quickActions = [
  { label: "Sovereign", icon: Crown, href: "/sovereign", color: "text-amber-500", roles: ["sovereign", "admin"] },
  { label: "Investor", icon: TrendingUp, href: "/investor", color: "text-emerald-500", roles: ["investor", "admin"] },
  { label: "Scientist", icon: FlaskConical, href: "/scientist", color: "text-sky-500", roles: ["scientist", "admin"] },
  { label: "Community", icon: Users, href: "/community", color: "text-violet-500", roles: ["community", "admin"] },
  { label: "Marketplace", icon: Store, href: "/marketplace", color: "text-primary", roles: [] },
  { label: "RCI Engine", icon: Cpu, href: "/rci-engine", color: "text-primary", roles: [] },
  { label: "Bonds", icon: Banknote, href: "/bond-lifecycle", color: "text-amber-500", roles: [] },
  { label: "Verification", icon: CheckCircle, href: "/verification", color: "text-emerald-500", roles: [] },
  { label: "Admin", icon: Shield, href: "/admin", color: "text-destructive", roles: ["admin"] },
];

const Dashboard = () => {
  const { user, roles, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    regions, selectedRegion, regionHistory, stats,
    isLoading, isLoadingHistory, isRealtimeActive, error,
    selectRegion, refetch,
  } = useDashboardData();

  const { timeSeriesData, pieData } = useChartData(regionHistory, selectedRegion);

  const [view, setView] = useState<"charts" | "table">("charts");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

  const handleExport = useCallback(() => {
    exportRCIRegionsToCSV(regions.map((r) => ({ ...r, last_updated: r.last_updated ?? null })));
  }, [regions]);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/auth" replace />;

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    </div>
  );

  const visibleActions = quickActions.filter(
    (a) => a.roles.length === 0 || a.roles.some((r) => roles.includes(r as any))
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userEmail={user.email || ""}
        roles={roles}
        isRealtimeActive={isRealtimeActive}
        onSignOut={signOut}
      />

      <main className="container px-4 md:px-6 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {visibleActions.map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.href)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-colors"
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} isLoading={isLoading} />

        {/* Toolbar */}
        <DashboardToolbar
          view={view}
          onViewChange={setView}
          regions={regions}
          selectedRegionId={selectedRegion?.id || null}
          onRegionSelect={selectRegion}
          onExport={handleExport}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Main Content */}
        {view === "charts" ? (
          <motion.div key="charts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RCITrendChart data={timeSeriesData} regionName={selectedRegion?.region_name || "Global"} isLoading={isLoadingHistory} />
            <CapacityBreakdown data={pieData} isLoading={isLoading} />
            <SectorTrendsChart data={timeSeriesData} isLoading={isLoadingHistory} />
            <RegionalRankings regions={regions} selectedRegionId={selectedRegion?.id || null}
              onRegionSelect={selectRegion} isLoading={isLoading} maxDisplay={8} />
          </motion.div>
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RegionsDataTable regions={regions} isLoading={isLoading} searchQuery={searchQuery} />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
