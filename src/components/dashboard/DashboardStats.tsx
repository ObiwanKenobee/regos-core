import { motion } from "framer-motion";
import { Globe, MapPin, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats as Stats } from "@/hooks/useDashboardData";

interface DashboardStatsProps {
  stats: Stats;
  isLoading: boolean;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  valueClassName,
  delay,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  valueClassName?: string;
  delay: number;
  isLoading: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="glass rounded-xl p-5 hover:bg-card/80 transition-colors group"
  >
    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
      <Icon className="w-4 h-4 group-hover:text-primary transition-colors" />
      <span>{label}</span>
    </div>
    {isLoading ? (
      <Skeleton className="h-9 w-20" />
    ) : (
      <div className={`text-3xl font-bold tracking-tight ${valueClassName || "text-foreground"}`}>
        {value}
      </div>
    )}
  </motion.div>
);

export const DashboardStats = ({ stats, isLoading }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={Globe}
        label="Global Average RCI"
        value={stats.globalAvgRCI.toFixed(1)}
        valueClassName="text-gradient-primary"
        delay={0}
        isLoading={isLoading}
      />
      <StatCard
        icon={MapPin}
        label="Regions Tracked"
        value={stats.totalRegions}
        delay={0.05}
        isLoading={isLoading}
      />
      <StatCard
        icon={TrendingUp}
        label="Improving"
        value={stats.improvingCount}
        valueClassName="text-emerald-400"
        delay={0.1}
        isLoading={isLoading}
      />
      <StatCard
        icon={AlertTriangle}
        label="At Risk"
        value={stats.decliningCount}
        valueClassName="text-destructive"
        delay={0.15}
        isLoading={isLoading}
      />
    </div>
  );
};

// Trend indicator component for reuse
export const TrendIndicator = ({ trend }: { trend: string | null }) => {
  switch (trend) {
    case "improving":
      return (
        <div className="flex items-center gap-1 text-emerald-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-medium">Improving</span>
        </div>
      );
    case "declining":
      return (
        <div className="flex items-center gap-1 text-destructive">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-medium">Declining</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1 text-amber-400">
          <Minus className="w-4 h-4" />
          <span className="text-xs font-medium">Stable</span>
        </div>
      );
  }
};
