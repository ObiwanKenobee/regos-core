import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Coins,
  ArrowLeft,
  RefreshCw,
  Download,
  PieChart as PieChartIcon,
  BarChart3,
  Leaf,
  Waves,
  Heart,
  Recycle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

interface TokenHolding {
  id: string;
  token_type: string;
  amount: number;
  minted_at: string;
  region_name: string;
  region_code: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalTokens: number;
  byType: { type: string; amount: number; value: number }[];
  byRegion: { region: string; amount: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(200, 60%, 50%)", "hsl(38, 90%, 55%)", "hsl(280, 60%, 55%)"];

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
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [view, setView] = useState<"overview" | "holdings" | "analytics">("overview");

  const isInvestor = roles.includes("investor") || roles.includes("admin");

  const {
    paginatedData: paginatedTokens,
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
    }
  }, [isInvestor, user]);

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
        .slice(0, 5);

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

  const mockPerformanceData = [
    { month: "Jan", value: 12500, tokens: 450 },
    { month: "Feb", value: 14200, tokens: 520 },
    { month: "Mar", value: 15800, tokens: 580 },
    { month: "Apr", value: 17500, tokens: 650 },
    { month: "May", value: 19200, tokens: 720 },
    { month: "Jun", value: portfolio?.totalValue || 21000, tokens: portfolio?.totalTokens || 800 },
  ];

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">
                    Investor Portfolio
                  </h1>
                  <p className="text-muted-foreground">
                    Track your regenerative impact token holdings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </motion.div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={view === "overview" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("overview")}
            >
              <PieChartIcon className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={view === "holdings" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("holdings")}
            >
              <Coins className="w-4 h-4 mr-2" />
              Holdings
            </Button>
            <Button
              variant={view === "analytics" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("analytics")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Portfolio Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  ${portfolio?.totalValue.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-primary" />
                  +12.5% this month
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Total Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-foreground">
                  {portfolio?.totalTokens.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Avg Token Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-foreground">
                  ${portfolio && portfolio.totalTokens > 0 
                    ? (portfolio.totalValue / portfolio.totalTokens).toFixed(2) 
                    : "0.00"}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Impact Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  {Math.min(100, Math.floor((portfolio?.totalTokens || 0) / 10))}
                </p>
                <Progress 
                  value={Math.min(100, Math.floor((portfolio?.totalTokens || 0) / 10))} 
                  className="mt-2 h-2" 
                />
              </CardContent>
            </Card>
          </motion.div>

          {view === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Value Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Portfolio Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockPerformanceData}>
                          <defs>
                            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#valueGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Token Allocation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Token Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={portfolio?.byType || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="amount"
                            nameKey="type"
                            label={({ type }) => type}
                            labelLine={false}
                          >
                            {(portfolio?.byType || []).map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              `${value.toLocaleString()} tokens`,
                              name.charAt(0).toUpperCase() + name.slice(1),
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {(portfolio?.byType || []).map((item, index) => (
                        <div key={item.type} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index] }}
                            />
                            {getTokenIcon(item.type)}
                            <span className="text-sm capitalize">{item.type}</span>
                          </div>
                          <span className="font-mono text-sm">{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top Regions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2"
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Holdings by Region</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={portfolio?.byRegion || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis
                            type="category"
                            dataKey="region"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            width={120}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value.toLocaleString()} tokens`, "Amount"]}
                          />
                          <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {view === "holdings" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-strong border-border/50">
                <CardHeader>
                  <CardTitle>Token Holdings</CardTitle>
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
                        {paginatedTokens.map((token) => (
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
                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                  {token.region_code}
                                </span>
                                {token.region_name}
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
            </motion.div>
          )}

          {view === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="glass-strong border-border/50">
                <CardHeader>
                  <CardTitle>Investment Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        Best Performing
                      </h4>
                      <p className="text-3xl font-display font-bold text-primary">
                        {portfolio?.byType.reduce((best, curr) => 
                          curr.value > best.value ? curr : best, 
                          portfolio.byType[0]
                        )?.type || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Highest value token type
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-secondary/30 border border-border">
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        Diversification
                      </h4>
                      <p className="text-3xl font-display font-bold text-foreground">
                        {portfolio?.byType.filter(t => t.amount > 0).length || 0}/4
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Token types held
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-secondary/30 border border-border">
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        Geographic Spread
                      </h4>
                      <p className="text-3xl font-display font-bold text-foreground">
                        {portfolio?.byRegion.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Regions represented
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-strong border-border/50">
                <CardHeader>
                  <CardTitle>Token Accumulation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="tokens"
                          stroke="hsl(38, 90%, 55%)"
                          fill="hsl(38, 90%, 55%)"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;
