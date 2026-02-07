import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  Crown, 
  LogOut, 
  User, 
  Wifi, 
  Settings,
  Home,
  Shield,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationCenter from "@/components/NotificationCenter";
import RoleSwitcher from "./RoleSwitcher";

interface SovereignHeaderProps {
  userEmail: string;
  roles: string[];
  isRealtimeActive: boolean;
  onSignOut: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "overview", label: "National Dashboard", icon: BarChart3 },
  { id: "bonds", label: "Bond Issuance", icon: Crown },
  { id: "simulation", label: "Policy Simulation", icon: Globe },
];

export const SovereignHeader = ({
  userEmail,
  roles,
  isRealtimeActive,
  onSignOut,
  activeTab,
  onTabChange,
}: SovereignHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo & Role Switcher */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-semibold text-foreground hidden sm:inline">
                Sovereign Portal
              </span>
            </a>

            <RoleSwitcher roles={roles} currentRole="sovereign" />

            <AnimatePresence>
              {isRealtimeActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30"
                >
                  <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">Live</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center - Tab Navigation */}
          <nav className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-background rounded-md shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <NotificationCenter />

            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <a href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </a>
            </Button>

            {roles.includes("admin") && (
              <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                <a href="/admin">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </a>
              </Button>
            )}

            <Button variant="ghost" size="sm" asChild>
              <a href="/settings">
                <Settings className="w-4 h-4" />
              </a>
            </Button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border/50">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
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

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden pb-3 -mx-4 px-4 overflow-x-auto">
          <div className="flex items-center gap-1 w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SovereignHeader;
