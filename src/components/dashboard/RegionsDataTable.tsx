import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RCIRegion } from "@/hooks/useDashboardData";

interface RegionsDataTableProps {
  regions: RCIRegion[];
  isLoading: boolean;
  searchQuery: string;
}

type SortKey = "region_name" | "rci_score" | "land_capacity" | "ocean_capacity" | "human_capacity" | "circular_capacity";
type SortDirection = "asc" | "desc";

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

const CapacityCell = ({ value, max = 100 }: { value: number | null; max?: number }) => {
  const normalizedValue = ((value ?? 0) / max) * 100;
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60"
          style={{ width: `${Math.min(normalizedValue, 100)}%` }}
        />
      </div>
      <span className="text-sm tabular-nums w-12">{(value ?? 0).toFixed(1)}</span>
    </div>
  );
};

export const RegionsDataTable = ({ regions, isLoading, searchQuery }: RegionsDataTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("rci_score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  const filteredAndSortedRegions = useMemo(() => {
    let result = [...regions];

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.region_name.toLowerCase().includes(query) ||
          r.region_code.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[sortKey] ?? 0;
      const bValue = b[sortKey] ?? 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return result;
  }, [regions, searchQuery, sortKey, sortDirection]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden"
      >
        <div className="p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
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
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("region_name")}
                  className="gap-2 -ml-3"
                >
                  Region
                  <SortIcon columnKey="region_name" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("rci_score")}
                  className="gap-2 -ml-3"
                >
                  RCI Score
                  <SortIcon columnKey="rci_score" />
                </Button>
              </TableHead>
              <TableHead>Trend</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("land_capacity")}
                  className="gap-2 -ml-3"
                >
                  Land
                  <SortIcon columnKey="land_capacity" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("ocean_capacity")}
                  className="gap-2 -ml-3"
                >
                  Ocean
                  <SortIcon columnKey="ocean_capacity" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("human_capacity")}
                  className="gap-2 -ml-3"
                >
                  Human
                  <SortIcon columnKey="human_capacity" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("circular_capacity")}
                  className="gap-2 -ml-3"
                >
                  Circular
                  <SortIcon columnKey="circular_capacity" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedRegions.map((region, index) => (
              <TableRow
                key={region.id}
                className={cn(
                  "border-border/30 transition-colors",
                  index % 2 === 0 ? "bg-card/20" : ""
                )}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{region.region_name}</p>
                    <p className="text-xs text-muted-foreground">{region.region_code}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-primary text-lg tabular-nums">
                    {region.rci_score.toFixed(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={region.rci_trend} />
                    <span className="text-sm capitalize text-muted-foreground">
                      {region.rci_trend || "stable"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <CapacityCell value={region.land_capacity} />
                </TableCell>
                <TableCell>
                  <CapacityCell value={region.ocean_capacity} />
                </TableCell>
                <TableCell>
                  <CapacityCell value={region.human_capacity} />
                </TableCell>
                <TableCell>
                  <CapacityCell value={region.circular_capacity} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedRegions.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No regions found matching "{searchQuery}"
        </div>
      )}
    </motion.div>
  );
};
