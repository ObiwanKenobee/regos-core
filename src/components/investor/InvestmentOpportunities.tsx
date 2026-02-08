import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Banknote,
  TrendingUp,
  Clock,
  Leaf,
  Target,
  Building2,
  Percent,
  Calendar,
  ExternalLink,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Bond {
  id: string;
  bond_name: string;
  bond_type: string;
  principal_amount: number;
  coupon_rate: number;
  maturity_date: string;
  rci_linked: boolean;
  rci_threshold: number | null;
  region?: {
    region_name: string;
    region_code: string;
    rci_score: number;
  };
}

const bondTypeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  green: { icon: Leaf, color: "text-emerald-500" },
  climate: { icon: Target, color: "text-blue-500" },
  sustainability: { icon: TrendingUp, color: "text-amber-500" },
  transition: { icon: Building2, color: "text-purple-500" },
};

export const InvestmentOpportunities = () => {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveBonds();
    loadWatchlist();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("bonds-investor")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sovereign_bonds" },
        () => fetchActiveBonds()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchActiveBonds = async () => {
    try {
      const { data, error } = await supabase
        .from("sovereign_bonds")
        .select(`
          id,
          bond_name,
          bond_type,
          principal_amount,
          coupon_rate,
          maturity_date,
          rci_linked,
          rci_threshold,
          region:rci_regions(region_name, region_code, rci_score)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBonds(data || []);
    } catch (error: any) {
      console.error("Error fetching bonds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWatchlist = () => {
    const stored = localStorage.getItem("investor_watchlist");
    if (stored) {
      setWatchlist(new Set(JSON.parse(stored)));
    }
  };

  const toggleWatchlist = (bondId: string) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(bondId)) {
      newWatchlist.delete(bondId);
      toast({ title: "Removed from Watchlist" });
    } else {
      newWatchlist.add(bondId);
      toast({ title: "Added to Watchlist" });
    }
    setWatchlist(newWatchlist);
    localStorage.setItem("investor_watchlist", JSON.stringify([...newWatchlist]));
  };

  if (isLoading) {
    return (
      <Card className="glass-strong border-border/50">
        <CardContent className="py-12 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-strong border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary" />
              Investment Opportunities
            </CardTitle>
            <CardDescription>
              RCI-linked sovereign bonds available for investment
            </CardDescription>
          </div>
          <Badge variant="outline">{bonds.length} Active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {bonds.length === 0 ? (
          <div className="text-center py-12">
            <Banknote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Bonds</h3>
            <p className="text-muted-foreground">
              Check back later for new investment opportunities
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bonds.map((bond) => {
              const TypeConfig = bondTypeConfig[bond.bond_type] || bondTypeConfig.green;
              const TypeIcon = TypeConfig.icon;
              const isWatched = watchlist.has(bond.id);
              const rciProgress = bond.region?.rci_score
                ? (bond.region.rci_score / (bond.rci_threshold || 100)) * 100
                : 0;

              return (
                <motion.div
                  key={bond.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-secondary ${TypeConfig.color}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{bond.bond_name}</h4>
                        <Badge variant="outline" className="text-xs capitalize mt-1">
                          {bond.bond_type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleWatchlist(bond.id)}
                    >
                      {isWatched ? (
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      ) : (
                        <StarOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Principal</span>
                      <span className="font-mono font-semibold">
                        ${(bond.principal_amount / 1_000_000).toFixed(0)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        Coupon Rate
                      </span>
                      <span className="font-mono text-primary font-semibold">
                        {bond.coupon_rate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Maturity
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(bond.maturity_date), "MMM yyyy")}
                      </span>
                    </div>
                  </div>

                  {bond.rci_linked && bond.region && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">
                          {bond.region.region_name} RCI Progress
                        </span>
                        <span className="font-mono text-primary">
                          {bond.region.rci_score.toFixed(1)}% / {bond.rci_threshold}%
                        </span>
                      </div>
                      <Progress value={Math.min(100, rciProgress)} className="h-2" />
                    </div>
                  )}

                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    View Details
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestmentOpportunities;
