import { motion } from "framer-motion";
import { Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RCIRegion } from "@/hooks/useDashboardData";

interface RegionalRankingsProps {
  regions: RCIRegion[];
  selectedRegionId: string | null;
  onRegionSelect: (regionId: string) => void;
  isLoading: boolean;
  maxDisplay?: number;
}

const TrendIcon = ({ trend }: { trend: string | null }) => {
  switch (trend) {
    case "improving":
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case "declining":
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    default:
      return <Minus className="w-4 h-4 text-amber-400" />;
  }
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank <= 3) {
    const colors = ["text-amber-400", "text-slate-400", "text-orange-400"];
    return (
      <div className={cn("flex items-center justify-center w-6", colors[rank - 1])}>
        <Medal className="w-4 h-4" />
      </div>
    );
  }
  return (
    <span className="w-6 text-center text-sm font-medium text-muted-foreground">
      {rank}
    </span>
  );
};

export const RegionalRankings = ({
  regions,
  selectedRegionId,
  onRegionSelect,
  isLoading,
  maxDisplay = 8,
}: RegionalRankingsProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6"
      >
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">Regional Rankings</h3>
        <span className="text-xs text-muted-foreground">Top {maxDisplay}</span>
      </div>

      <div className="space-y-2">
        {regions.slice(0, maxDisplay).map((region, index) => (
          <motion.button
            key={region.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            onClick={() => onRegionSelect(region.id)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg transition-all",
              "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
              selectedRegionId === region.id
                ? "bg-primary/10 border border-primary/30"
                : "bg-muted/20"
            )}
          >
            <div className="flex items-center gap-3">
              <RankBadge rank={index + 1} />
              <div className="text-left">
                <p className="font-medium text-sm">{region.region_name}</p>
                <p className="text-xs text-muted-foreground">{region.region_code}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-primary tabular-nums">
                {region.rci_score.toFixed(1)}
              </span>
              <TrendIcon trend={region.rci_trend} />
            </div>
          </motion.button>
        ))}
      </div>

      {regions.length > maxDisplay && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          +{regions.length - maxDisplay} more regions
        </p>
      )}
    </motion.div>
  );
};
