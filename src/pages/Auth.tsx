import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Globe, Shield, Users, FlaskConical, Landmark, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AppRole = "sovereign" | "investor" | "scientist" | "community";

const roleOptions: { value: AppRole; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "sovereign",
    label: "Sovereign",
    icon: <Landmark className="w-5 h-5" />,
    description: "Governments & ministries accessing RCI intelligence",
  },
  {
    value: "investor",
    label: "Investor",
    icon: <Shield className="w-5 h-5" />,
    description: "Capital markets & institutional investors",
  },
  {
    value: "scientist",
    label: "Scientist",
    icon: <FlaskConical className="w-5 h-5" />,
    description: "Researchers & methodology contributors",
  },
  {
    value: "community",
    label: "Community",
    icon: <Users className="w-5 h-5" />,
    description: "Local stewards & community organizations",
  },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("community");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Authentication failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back",
            description: "Successfully authenticated to Atlas Sanctum",
          });
          // Check if onboarding is complete
          const { data: onboarding } = await supabase
            .from("onboarding_progress")
            .select("completed_at")
            .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
            .maybeSingle();
          navigate(onboarding?.completed_at ? "/dashboard" : "/onboarding");
        }
      } else {
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          toast({
            title: "Registration failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration successful",
            description: "Please check your email to verify your account, then sign in.",
          });
          // Don't navigate — user needs to verify email first
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 bg-glow opacity-50" />
        
        {/* Orbital rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {[300, 450, 600].map((size, i) => (
            <motion.div
              key={size}
              className="absolute rounded-full border border-primary/20"
              style={{
                width: size,
                height: size,
                left: -size / 2,
                top: -size / 2,
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 30 + i * 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 p-12 flex flex-col justify-center">
          <a href="/" className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </a>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-glow">
                <Globe className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-bold text-foreground">
                Atlas Sanctum
              </span>
            </div>

            <h1 className="font-display text-4xl font-bold mb-4">
              <span className="text-gradient-primary">Regenerative</span>
              <br />
              Operating System
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              Access the planetary coordination layer that measures, governs, and finances regenerative capacity across Earth's systems.
            </p>

            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">Ethically constrained governance</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">Global RCI intelligence</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">Sovereign-grade analytics</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </a>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">
                Atlas Sanctum
              </span>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold mb-2">
            {isLogin ? "Welcome back" : "Join Atlas Sanctum"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isLogin
              ? "Enter your credentials to access the system"
              : "Create your account and select your steward role"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="bg-card border-border"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-card border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-card border-border"
              />
            </div>

            {!isLogin && (
              <div className="space-y-3">
                <Label>Select Your Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedRole === role.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className={`mb-2 ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`}>
                        {role.icon}
                      </div>
                      <div className="font-medium text-sm">{role.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {role.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
