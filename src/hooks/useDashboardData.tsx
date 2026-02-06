import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RCIRegion {
  id: string;
  region_code: string;
  region_name: string;
  rci_score: number;
  rci_trend: string | null;
  land_capacity: number | null;
  ocean_capacity: number | null;
  human_capacity: number | null;
  circular_capacity: number | null;
  last_updated: string | null;
}

export interface RCIHistoryPoint {
  id: string;
  region_id: string;
  rci_score: number;
  land_capacity: number | null;
  ocean_capacity: number | null;
  human_capacity: number | null;
  circular_capacity: number | null;
  recorded_at: string;
}

export interface DashboardStats {
  globalAvgRCI: number;
  totalRegions: number;
  improvingCount: number;
  decliningCount: number;
  stableCount: number;
}

const fetchRegions = async (): Promise<RCIRegion[]> => {
  const { data, error } = await supabase
    .from("rci_regions")
    .select("*")
    .order("rci_score", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const fetchRegionHistory = async (regionId: string): Promise<RCIHistoryPoint[]> => {
  const { data, error } = await supabase
    .from("rci_history")
    .select("*")
    .eq("region_id", regionId)
    .order("recorded_at", { ascending: true })
    .limit(12);

  if (error) throw new Error(error.message);
  return data || [];
};

export const useDashboardData = () => {
  const queryClient = useQueryClient();
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  // Fetch all regions
  const {
    data: regions = [],
    isLoading: isLoadingRegions,
    error: regionsError,
    refetch: refetchRegions,
  } = useQuery({
    queryKey: ["rci-regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Auto-select first region when regions load
  useEffect(() => {
    if (regions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(regions[0].id);
    }
  }, [regions, selectedRegionId]);

  // Fetch history for selected region
  const {
    data: regionHistory = [],
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ["rci-history", selectedRegionId],
    queryFn: () => fetchRegionHistory(selectedRegionId!),
    enabled: !!selectedRegionId,
    staleTime: 1000 * 60 * 5,
  });

  // Calculate dashboard stats
  const stats: DashboardStats = {
    globalAvgRCI: regions.length > 0
      ? regions.reduce((sum, r) => sum + r.rci_score, 0) / regions.length
      : 0,
    totalRegions: regions.length,
    improvingCount: regions.filter((r) => r.rci_trend === "improving").length,
    decliningCount: regions.filter((r) => r.rci_trend === "declining").length,
    stableCount: regions.filter((r) => r.rci_trend === "stable" || !r.rci_trend).length,
  };

  // Get selected region
  const selectedRegion = regions.find((r) => r.id === selectedRegionId) || null;

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("dashboard_rci_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rci_regions",
        },
        (payload) => {
          setIsRealtimeActive(true);
          
          // Optimistically update the cache
          queryClient.setQueryData<RCIRegion[]>(["rci-regions"], (oldData) => {
            if (!oldData) return oldData;
            
            if (payload.eventType === "INSERT") {
              return [...oldData, payload.new as RCIRegion].sort(
                (a, b) => b.rci_score - a.rci_score
              );
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new as RCIRegion;
              return oldData
                .map((r) => (r.id === updated.id ? updated : r))
                .sort((a, b) => b.rci_score - a.rci_score);
            } else if (payload.eventType === "DELETE") {
              return oldData.filter((r) => r.id !== (payload.old as RCIRegion).id);
            }
            return oldData;
          });

          setTimeout(() => setIsRealtimeActive(false), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Select a region
  const selectRegion = useCallback((regionId: string) => {
    setSelectedRegionId(regionId);
  }, []);

  return {
    // Data
    regions,
    selectedRegion,
    regionHistory,
    stats,
    
    // Loading states
    isLoading: isLoadingRegions,
    isLoadingHistory,
    isRealtimeActive,
    
    // Error states
    error: regionsError,
    
    // Actions
    selectRegion,
    refetch: refetchRegions,
  };
};

// Transform history data for charts
export const useChartData = (history: RCIHistoryPoint[], selectedRegion: RCIRegion | null) => {
  const timeSeriesData = history.length > 0
    ? history.map((h) => ({
        date: new Date(h.recorded_at).toLocaleDateString("en-US", { month: "short" }),
        rci: h.rci_score,
        land: h.land_capacity ?? 0,
        ocean: h.ocean_capacity ?? 0,
        human: h.human_capacity ?? 0,
        circular: h.circular_capacity ?? 0,
      }))
    : generateMockTimeSeriesData();

  const pieData = selectedRegion
    ? [
        { name: "Land", value: selectedRegion.land_capacity ?? 0 },
        { name: "Ocean", value: selectedRegion.ocean_capacity ?? 0 },
        { name: "Human", value: selectedRegion.human_capacity ?? 0 },
        { name: "Circular", value: selectedRegion.circular_capacity ?? 0 },
      ]
    : [];

  return { timeSeriesData, pieData };
};

// Generate mock data when no history exists
const generateMockTimeSeriesData = () => [
  { date: "Jan", rci: 62.4, land: 65.2, ocean: 58.1, human: 61.8, circular: 54.3 },
  { date: "Feb", rci: 63.1, land: 66.4, ocean: 59.2, human: 62.1, circular: 55.8 },
  { date: "Mar", rci: 64.8, land: 68.1, ocean: 60.4, human: 63.5, circular: 57.2 },
  { date: "Apr", rci: 65.2, land: 69.2, ocean: 61.8, human: 64.2, circular: 58.1 },
  { date: "May", rci: 66.9, land: 71.4, ocean: 62.5, human: 65.8, circular: 59.4 },
  { date: "Jun", rci: 68.4, land: 73.2, ocean: 64.1, human: 67.2, circular: 61.2 },
];
