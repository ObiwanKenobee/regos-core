import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Microscope,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Upload,
  BookOpen,
  Activity,
  FlaskConical,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import {
  ResearchSubmission,
  MethodologyContributions,
  DataAnalysisTools,
} from "@/components/scientist";
import { RoleSwitcher } from "@/components/sovereign";

interface Region {
  id: string;
  region_name: string;
  region_code: string;
}

const ScientistDashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const isScientist = roles.includes("scientist") || roles.includes("admin");

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
      fetchRegions();
    }
  }, [isScientist, user]);

  const fetchRegions = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("rci_regions")
        .select("id, region_name, region_code")
        .order("region_name");

      if (error) throw error;
      setRegions(data || []);
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Microscope className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-display font-bold text-foreground">
                      Research Dashboard
                    </h1>
                    <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                      <FlaskConical className="w-3 h-3 mr-1" />
                      Scientist
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Analyze RCI data, submit research, and contribute to methodology
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RoleSwitcher roles={roles} currentRole="scientist" />
                <Button variant="outline" size="sm" onClick={fetchRegions}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="research" className="gap-2">
                <Upload className="w-4 h-4" />
                Submit Research
              </TabsTrigger>
              <TabsTrigger value="contributions" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Contributions
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <Activity className="w-4 h-4" />
                Data Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <ResearchSubmission 
                  regions={regions} 
                  userId={user?.id || ""} 
                />
                <MethodologyContributions />
              </motion.div>
            </TabsContent>

            <TabsContent value="research">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ResearchSubmission 
                  regions={regions} 
                  userId={user?.id || ""} 
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="contributions">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <MethodologyContributions />
              </motion.div>
            </TabsContent>

            <TabsContent value="analysis">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <DataAnalysisTools />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ScientistDashboard;
