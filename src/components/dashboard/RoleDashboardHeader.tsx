import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Home,
  Shield,
  LogOut,
  User,
  Wifi,
  Settings,
  Crown,
  TrendingUp,
  FlaskConical,
  Users,
  BarChart3,
  Store,
  CheckCircle,
  Workflow,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";
import RoleSwitcher from "@/components/sovereign/RoleSwitcher";

type AppRole = "sovereign" | "investor" | "scientist" | "community" | "admin";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface RoleDashboardHeaderProps {
  userEmail: string;
  roles: string[];
  currentRole: AppRole;
  isRealtimeActive?: boolean;
  onSignOut: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: Tab[];
  title: string;
  accentColor?: string;
  accentIcon?: React.ElementType;
}

export const RoleDashboardHeader = ({
  userEmail,
  roles,
  currentRole,
  isRealtimeActive = false,
  onSignOut,
  activeTab,
  onTabChange,
  tabs = [],
  title,
  accentColor = "from-primary to-primary/60",
  accentIcon: AccentIcon = Globe,
}: RoleDashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left — branding + role */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 group">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center transition-transform group-hover:scale-105`}>
                <AccentIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground hidden sm:inline">
                {title}
              </span>
            </a>

            <RoleSwitcher roles={roles} currentRole={currentRole} />

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

          {/* Center — tabs */}
          {tabs.length > 0 && onTabChange && (
            <nav className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId={`activeTab-${currentRole}`}
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
          )}

          {/* Right — actions */}
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
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${accentColor} flex items-center justify-center`}>
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

        {/* Mobile tabs */}
        {tabs.length > 0 && onTabChange && (
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
        )}
      </div>
    </header>
  );
};

export default RoleDashboardHeader;
