import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, RefreshCw } from "lucide-react";
import VerificationWorkflow from "@/components/VerificationWorkflow";

const VerificationCenter = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  const isAuthorized = roles.includes("admin") || roles.includes("sovereign");

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
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-display font-bold text-foreground">
                    Multi-Sig Verification Center
                  </h1>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Shield className="w-3 h-3 mr-1" /> Governance
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  End-to-end verification workflow with evidence review, multi-signature collection, and automated token minting
                </p>
              </div>
            </div>
          </motion.div>

          <VerificationWorkflow />
        </div>
      </div>
    </div>
  );
};

export default VerificationCenter;
