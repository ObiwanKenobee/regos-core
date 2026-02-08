import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  ArrowLeft,
  RefreshCw,
  Download,
  PieChart as PieChartIcon,
  Coins,
  Banknote,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import {
  PortfolioSummary,
  InvestmentOpportunities,
  RegionalAllocation,
} from "@/components/investor";
import { RoleSwitcher } from "@/components/sovereign";
import { exportAnalyticsToCSV } from "@/utils/exportData";

interface TokenHolding {
  id: string;
  token_type: string;
  amount: number;
  minted_at: string;
  region_name: string;
  region_code: string;
}

interface PortfolioData {
  totalValue: number;
  totalTokens: number;
  byType: { type: string; amount: number; value: number }[];
  byRegion: { region: string; amount: number }[];
}

const TOKEN_VALUES: Record<string, number> = {
  land: 25,
  ocean: 30,
  health: 35,
  circular: 20,
};

const InvestorDashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<TokenHolding[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const isInvestor = roles.includes("investor") || roles.includes("admin");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && !isInvestor) {
      toast({
        title: "Access Denied",
        description: "You need investor privileges to access this dashboard.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, roles, loading, navigate, isInvestor]);

  useEffect(() => {
    if (isInvestor && user) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [isInvestor, user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("investor-tokens")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "impact_tokens" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const { data: tokensData, error } = await supabase
        .from("impact_tokens")
        .select(`
          id,
          token_type,
          amount,
          minted_at,
          region:rci_regions(region_name, region_code)
        `)
        .order("minted_at", { ascending: false });

      if (error) throw error;

      const formattedTokens: TokenHolding[] = (tokensData || []).map((t: any) => ({
        id: t.id,
        token_type: t.token_type,
        amount: t.amount,
        minted_at: t.minted_at,
        region_name: t.region?.region_name || "Unknown",
        region_code: t.region?.region_code || "N/A",
      }));

      setTokens(formattedTokens);

      // Calculate portfolio summary
      const byType = ["land", "ocean", "health", "circular"].map((type) => {
        const typeTokens = formattedTokens.filter((t) => t.token_type === type);
        const amount = typeTokens.reduce((sum, t) => sum + t.amount, 0);
        return { type, amount, value: amount * TOKEN_VALUES[type] };
      });

      const regionMap = new Map<string, number>();
      formattedTokens.forEach((t) => {
        const current = regionMap.get(t.region_name) || 0;
        regionMap.set(t.region_name, current + t.amount);
      });

      const byRegion = Array.from(regionMap.entries())
        .map(([region, amount]) => ({ region, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      const totalTokens = formattedTokens.reduce((sum, t) => sum + t.amount, 0);
      const totalValue = byType.reduce((sum, t) => sum + t.value, 0);

      setPortfolio({ totalValue, totalTokens, byType, byRegion });
    } catch (error: any) {
      toast({
        title: "Error fetching portfolio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleExport = () => {
    if (tokens.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const data = tokens.map((t): Record<string, unknown> => ({
      Type: t.token_type,
      Amount: t.amount,
      Value: t.amount * TOKEN_VALUES[t.token_type],
      Region: t.region_name,
      "Region Code": t.region_code,
      "Minted At": new Date(t.minted_at).toLocaleString(),
    }));

    exportAnalyticsToCSV(data as Record<string, unknown>[], `investor-portfolio-${new Date().toISOString().split("T")[0]}`);
    toast({ title: "Portfolio exported successfully" });
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isInvestor) {
    return null;
  }

  const impactScore = Math.min(100, Math.floor((portfolio?.totalTokens || 0) / 10));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-display font-bold text-foreground">
                      Investor Portfolio
                    </h1>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Track your regenerative impact token holdings and investments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RoleSwitcher roles={roles} currentRole="investor" />
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Portfolio Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <PortfolioSummary
              totalValue={portfolio?.totalValue || 0}
              totalTokens={portfolio?.totalTokens || 0}
              impactScore={impactScore}
            />
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="overview" className="gap-2">
                <PieChartIcon className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="gap-2">
                <Banknote className="w-4 h-4" />
                Opportunities
              </TabsTrigger>
              <TabsTrigger value="allocation" className="gap-2">
                <MapPin className="w-4 h-4" />
                Allocation
              </TabsTrigger>
              <TabsTrigger value="holdings" className="gap-2">
                <Coins className="w-4 h-4" />
                Holdings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <InvestmentOpportunities />
              </motion.div>
            </TabsContent>

            <TabsContent value="opportunities">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <InvestmentOpportunities />
              </motion.div>
            </TabsContent>

            <TabsContent value="allocation">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <RegionalAllocation
                  byRegion={portfolio?.byRegion || []}
                  totalTokens={portfolio?.totalTokens || 0}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="holdings">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <HoldingsTable tokens={tokens} />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Holdings Table Component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";
import { Leaf, Waves, Heart, Recycle } from "lucide-react";

const HoldingsTable = ({ tokens }: { tokens: TokenHolding[] }) => {
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    startIndex,
    endIndex,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
  } = usePagination({ data: tokens, itemsPerPage: 10 });

  const getTokenIcon = (type: string) => {
    switch (type) {
      case "land":
        return <Leaf className="w-4 h-4 text-primary" />;
      case "ocean":
        return <Waves className="w-4 h-4 text-blue-500" />;
      case "health":
        return <Heart className="w-4 h-4 text-rose-500" />;
      case "circular":
        return <Recycle className="w-4 h-4 text-purple-500" />;
      default:
        return <Coins className="w-4 h-4" />;
    }
  };

  return (
    <Card className="glass-strong border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          Token Holdings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Minted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTokenIcon(token.token_type)}
                      <Badge variant="outline" className="capitalize">
                        {token.token_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {token.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-primary">
                    ${(token.amount * TOKEN_VALUES[token.token_type]).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {token.region_code}
                      </Badge>
                      <span className="text-muted-foreground">{token.region_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(token.minted_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </CardContent>
    </Card>
  );
};

export default InvestorDashboard;
