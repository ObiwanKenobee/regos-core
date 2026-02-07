import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  SovereignHeader,
  NationalDashboard,
  BondIssuance,
  SovereignPolicySimulator,
} from "@/components/sovereign";

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

const SovereignDashboard = () => {
  const { user, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<RCIRegion[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
      fetchRegions();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [isSovereign, user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("sovereign-rci-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rci_regions" },
        (payload) => {
          setIsRealtimeActive(true);
          if (payload.eventType === "UPDATE") {
            setRegions((prev) =>
              prev.map((r) =>
                r.id === (payload.new as RCIRegion).id
                  ? (payload.new as RCIRegion)
                  : r
              )
            );
          } else if (payload.eventType === "INSERT") {
            setRegions((prev) => [...prev, payload.new as RCIRegion]);
          }
          // Reset realtime indicator after a moment
          setTimeout(() => setIsRealtimeActive(false), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchRegions = async () => {
    setIsLoadingData(true);
    try {
      // If admin, show all regions; otherwise show only assigned regions
      if (roles.includes("admin")) {
        const { data, error } = await supabase
          .from("rci_regions")
          .select("*")
          .order("rci_score", { ascending: false });

        if (error) throw error;
        setRegions(data || []);
      } else {
        // Fetch assigned regions for sovereign users
        const { data: assignments, error: assignError } = await supabase
          .from("user_region_assignments")
          .select("region_id")
          .eq("user_id", user?.id);

        if (assignError) throw assignError;

        const regionIds = assignments?.map((a) => a.region_id) || [];

        if (regionIds.length > 0) {
          const { data, error } = await supabase
            .from("rci_regions")
            .select("*")
            .in("id", regionIds)
            .order("rci_score", { ascending: false });

          if (error) throw error;
          setRegions(data || []);
        } else {
          setRegions([]);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error fetching regions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSovereign) {
    return null;
  }

  // Get primary region name for policy simulator
  const primaryRegion = regions[0]?.region_name || "Your Territory";

  return (
    <div className="min-h-screen bg-background">
      <SovereignHeader
        userEmail={user?.email || ""}
        roles={roles}
        isRealtimeActive={isRealtimeActive}
        onSignOut={handleSignOut}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="container px-4 md:px-6 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && (
            <NationalDashboard regions={regions} isLoading={isLoadingData} />
          )}

          {activeTab === "bonds" && (
            <BondIssuance regions={regions} userId={user?.id || ""} />
          )}

          {activeTab === "simulation" && (
            <SovereignPolicySimulator
              regionName={primaryRegion}
              baselineRCI={regions[0]?.rci_score || 65}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default SovereignDashboard;
