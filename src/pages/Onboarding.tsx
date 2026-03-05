import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Globe, Shield, TrendingUp, FlaskConical, Users, Building2,
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Rocket, Target
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const STEPS: OnboardingStep[] = [
  { id: "welcome", title: "Welcome to Atlas Sanctum", description: "The Regenerative Operating System for planetary coordination", icon: Globe },
  { id: "role", title: "Choose Your Role", description: "Select how you'll engage with the platform", icon: Shield },
  { id: "org", title: "Set Up Your Workspace", description: "Create or join an organization to collaborate", icon: Building2 },
  { id: "explore", title: "You're Ready", description: "Explore your personalized dashboard", icon: Rocket },
];

const ROLES = [
  { id: "sovereign", label: "Sovereign", description: "National coordination & policy simulation", icon: Shield, color: "border-primary/30 bg-primary/5" },
  { id: "investor", label: "Investor", description: "Portfolio analytics & bond lifecycle", icon: TrendingUp, color: "border-accent/30 bg-accent/5" },
  { id: "scientist", label: "Scientist", description: "Research analytics & methodology", icon: FlaskConical, color: "border-blue-500/30 bg-blue-500/5" },
  { id: "community", label: "Community", description: "Participate, verify & earn tokens", icon: Users, color: "border-emerald-500/30 bg-emerald-500/5" },
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const handleNext = async () => {
    if (currentStep === 1 && !selectedRole) return;

    if (currentStep === 2 && orgName && orgSlug) {
      setSaving(true);
      await supabase.from("organizations").insert({
        name: orgName,
        slug: orgSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        created_by: user!.id,
      });
      setSaving(false);
    }

    if (currentStep === STEPS.length - 1) {
      // Save onboarding complete
      if (user) {
        await supabase.from("onboarding_progress").upsert({
          user_id: user.id,
          current_step: STEPS.length,
          role_selected: selectedRole,
          org_created: !!orgName,
          tour_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }

      // Navigate based on role
      const routes: Record<string, string> = {
        sovereign: "/sovereign",
        investor: "/investor",
        scientist: "/scientist",
        community: "/community",
      };
      navigate(routes[selectedRole || "community"] || "/dashboard");
      return;
    }

    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSkipOrg = () => setCurrentStep(3);

  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i < currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {/* Welcome Step */}
            {currentStep === 0 && (
              <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Globe className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-3xl font-display">Welcome to Atlas Sanctum</CardTitle>
                  <CardDescription className="text-lg mt-4 max-w-md mx-auto">
                    The Regenerative Operating System measuring and financing planetary capacity across
                    land, oceans, health, and circular economies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                      { icon: Target, label: "RCI Intelligence", desc: "Real-time capacity tracking" },
                      { icon: Shield, label: "Sovereign Bonds", desc: "RCI-linked instruments" },
                      { icon: Sparkles, label: "Impact Tokens", desc: "Verified regenerative credits" },
                      { icon: Users, label: "Multi-sig Governance", desc: "Decentralized verification" },
                    ].map((f) => (
                      <div key={f.label} className="p-4 rounded-lg bg-muted/50 border border-border/50 text-left">
                        <f.icon className="w-5 h-5 text-primary mb-2" />
                        <p className="text-sm font-medium text-foreground">{f.label}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Role Selection */}
            {currentStep === 1 && (
              <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-display">Choose Your Role</CardTitle>
                  <CardDescription>This determines your default dashboard and capabilities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={`p-5 rounded-xl border-2 text-left transition-all ${
                          selectedRole === role.id
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : `${role.color} hover:border-primary/50`
                        }`}
                      >
                        <role.icon className={`w-8 h-8 mb-3 ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="font-semibold text-foreground">{role.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organization Setup */}
            {currentStep === 2 && (
              <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-display">Set Up Your Workspace</CardTitle>
                  <CardDescription>Create an organization to collaborate with your team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Organization Name</Label>
                    <Input
                      value={orgName}
                      onChange={(e) => {
                        setOrgName(e.target.value);
                        setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                      }}
                      placeholder="Ministry of Environment"
                    />
                  </div>
                  <div>
                    <Label>URL Slug</Label>
                    <Input value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} placeholder="ministry-of-environment" />
                  </div>
                  <Button variant="link" className="text-muted-foreground" onClick={handleSkipOrg}>
                    Skip for now →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Complete */}
            {currentStep === 3 && (
              <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Rocket className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-3xl font-display">You're All Set!</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    Your {selectedRole ? ROLES.find(r => r.id === selectedRole)?.label : ""} dashboard is ready
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
                    {selectedRole ? `${ROLES.find(r => r.id === selectedRole)?.label} Role` : "Ready"}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={handleNext} disabled={currentStep === 1 && !selectedRole || saving} className="gap-2">
            {currentStep === STEPS.length - 1 ? "Enter Dashboard" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Onboarding;
