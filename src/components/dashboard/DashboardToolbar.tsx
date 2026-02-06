import { BarChart3, Table2, Download, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RCIRegion } from "@/hooks/useDashboardData";

interface DashboardToolbarProps {
  view: "charts" | "table";
  onViewChange: (view: "charts" | "table") => void;
  regions: RCIRegion[];
  selectedRegionId: string | null;
  onRegionSelect: (regionId: string) => void;
  onExport: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const DashboardToolbar = ({
  view,
  onViewChange,
  regions,
  selectedRegionId,
  onRegionSelect,
  onExport,
  onRefresh,
  isRefreshing,
  searchQuery,
  onSearchChange,
}: DashboardToolbarProps) => {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 glass rounded-xl">
      {/* Left side - View toggle & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
          <Button
            variant={view === "charts" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("charts")}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Charts</span>
          </Button>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("table")}
            className="gap-2"
          >
            <Table2 className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search regions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
      </div>

      {/* Right side - Region selector & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Focus:</span>
          <Select value={selectedRegionId || ""} onValueChange={onRegionSelect}>
            <SelectTrigger className="w-full sm:w-[200px] bg-background/50">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  <div className="flex items-center gap-2">
                    <span>{region.region_name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({region.rci_score.toFixed(1)})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
