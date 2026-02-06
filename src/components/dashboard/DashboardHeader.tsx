import { motion, AnimatePresence } from "framer-motion";
import { Globe, Home, Shield, Crown, LogOut, User, Wifi, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";

interface DashboardHeaderProps {
  userEmail: string;
  roles: string[];
  isRealtimeActive: boolean;
  onSignOut: () => void;
}

export const DashboardHeader = ({
  userEmail,
  roles,
  isRealtimeActive,
  onSignOut,
}: DashboardHeaderProps) => {
  const primaryRole = roles[0] || "User";

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo & Role */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center transition-transform group-hover:scale-105">
                <Globe className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground hidden sm:inline">
                Atlas Sanctum
              </span>
            </a>
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium text-primary capitalize">
                {primaryRole}
              </span>
              <span className="text-xs text-muted-foreground">Dashboard</span>
            </div>

            <AnimatePresence>
              {isRealtimeActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30"
                >
                  <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">Live</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right side - Navigation & User */}
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <a href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </a>
              </Button>

              {(roles.includes("sovereign") || roles.includes("admin")) && (
                <Button variant="ghost" size="sm" asChild>
                  <a href="/sovereign">
                    <Crown className="w-4 h-4 mr-2" />
                    Sovereign
                  </a>
                </Button>
              )}

              {roles.includes("admin") && (
                <Button variant="ghost" size="sm" asChild>
                  <a href="/admin">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </a>
                </Button>
              )}
            </nav>

            <div className="flex items-center gap-2 ml-2">
              <NotificationCenter />

              <Button variant="ghost" size="sm" asChild>
                <a href="/settings">
                  <Settings className="w-4 h-4" />
                </a>
              </Button>

              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border/50">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <User className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-sm text-muted-foreground max-w-[150px] truncate">
                  {userEmail}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
