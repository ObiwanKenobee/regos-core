import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, Database, Radio, RefreshCw } from "lucide-react";
import { LiveScoringPanel, DataIngestionMonitor } from "@/components/rci-engine";

const RCIEngine = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("scoring");

  const isAuthorized = roles.includes("admin") || roles.includes("sovereign") || roles.includes("scientist");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && !isAuthorized) navigate("/dashboard");
  }, [user, roles, loading, navigate, isAuthorized]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container px-4 md:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-display font-bold text-foreground">RCI Scoring Engine</h1>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Radio className="w-3 h-3 mr-1" /> Real-time
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Live capacity scoring, data ingestion pipeline, and automated RCI computation
                </p>
              </div>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="scoring" className="gap-2">
                <Zap className="w-4 h-4" /> Live Scoring
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="gap-2">
                <Database className="w-4 h-4" /> Data Pipeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scoring">
              <LiveScoringPanel />
            </TabsContent>

            <TabsContent value="pipeline">
              <DataIngestionMonitor />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RCIEngine;
