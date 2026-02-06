import { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData, useChartData } from "@/hooks/useDashboardData";
import { exportRCIRegionsToCSV } from "@/utils/exportData";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const Dashboard = () => {
  const { user, roles, loading: authLoading, signOut } = useAuth();
  const {
    regions,
    selectedRegion,
    regionHistory,
    stats,
    isLoading,
    isLoadingHistory,
    isRealtimeActive,
    error,
    selectRegion,
    refetch,
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
    exportRCIRegionsToCSV(
      regions.map((r) => ({
        ...r,
        last_updated: r.last_updated ?? null,
      }))
    );
  }, [regions]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Auth redirect
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userEmail={user.email || ""}
        roles={roles}
        isRealtimeActive={isRealtimeActive}
        onSignOut={signOut}
      />

      <main className="container px-4 md:px-6 py-6 space-y-6">
        {/* Stats Cards */}
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
          <motion.div
            key="charts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* RCI Trend Chart - Full width on mobile, 2/3 on desktop */}
            <RCITrendChart
              data={timeSeriesData}
              regionName={selectedRegion?.region_name || "Global"}
              isLoading={isLoadingHistory}
            />

            {/* Capacity Breakdown Pie Chart */}
            <CapacityBreakdown data={pieData} isLoading={isLoading} />

            {/* Sector Trends Line Chart */}
            <SectorTrendsChart data={timeSeriesData} isLoading={isLoadingHistory} />

            {/* Regional Rankings */}
            <RegionalRankings
              regions={regions}
              selectedRegionId={selectedRegion?.id || null}
              onRegionSelect={selectRegion}
              isLoading={isLoading}
              maxDisplay={8}
            />
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RegionsDataTable
              regions={regions}
              isLoading={isLoading}
              searchQuery={searchQuery}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
