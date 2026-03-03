import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Coins, TreeDeciduous, Droplets, Activity, Repeat, ArrowUpDown,
  Send, Wallet, TrendingUp, Search, RefreshCw, ShoppingCart,
  ArrowRight, ExternalLink, Clock, CheckCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const tokenTypeConfig = {
  land: { icon: TreeDeciduous, color: "#22c55e", bg: "bg-green-500/10", label: "Land Regeneration" },
  ocean: { icon: Droplets, color: "#3b82f6", bg: "bg-blue-500/10", label: "Blue Economy" },
  health: { icon: Activity, color: "#f43f5e", bg: "bg-rose-500/10", label: "Human Wellbeing" },
  circular: { icon: Repeat, color: "#a855f7", bg: "bg-purple-500/10", label: "Circular Economy" },
};

interface TokenListing {
  id: string;
  token_type: string;
  amount: number;
  region_name: string;
  region_code: string;
  minted_at: string;
  transaction_hash: string | null;
}

const Marketplace = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedToken, setSelectedToken] = useState<TokenListing | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");

  // Fetch all tokens
  const { data: allTokens = [], isLoading } = useQuery({
    queryKey: ["marketplace-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("impact_tokens")
        .select("*, region:rci_regions(region_name, region_code)")
        .order("minted_at", { ascending: false });
      if (error) throw error;
      return data.map((t: any) => ({
        id: t.id,
        token_type: t.token_type,
        amount: Number(t.amount),
        region_name: t.region?.region_name || "Unknown",
        region_code: t.region?.region_code || "??",
        minted_at: t.minted_at,
        transaction_hash: t.transaction_hash,
        minted_by: t.minted_by,
      }));
    },
  });

  // Fetch user's own tokens
  const { data: myTokens = [] } = useQuery({
    queryKey: ["my-tokens", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("impact_tokens")
        .select("*, region:rci_regions(region_name, region_code)")
        .eq("minted_by", user.id)
        .order("minted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Filtered tokens for browse
  const filteredTokens = useMemo(() => {
    let filtered = allTokens;
    if (typeFilter !== "all") {
      filtered = filtered.filter((t: any) => t.token_type === typeFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter((t: any) =>
        t.region_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.token_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [allTokens, typeFilter, searchQuery]);

  // Portfolio stats
  const portfolioStats = useMemo(() => {
    const stats = { total: 0, land: 0, ocean: 0, health: 0, circular: 0, count: 0 };
    myTokens.forEach((t: any) => {
      const amt = Number(t.amount);
      stats.total += amt;
      stats[t.token_type as keyof typeof stats] = (stats[t.token_type as keyof typeof stats] as number || 0) + amt;
      stats.count++;
    });
    return stats;
  }, [myTokens]);

  // Market overview stats
  const marketStats = useMemo(() => {
    const total = allTokens.reduce((s: number, t: any) => s + t.amount, 0);
    const byType: Record<string, number> = {};
    allTokens.forEach((t: any) => {
      byType[t.token_type] = (byType[t.token_type] || 0) + t.amount;
    });
    const pieData = Object.entries(byType).map(([type, amount]) => ({
      name: tokenTypeConfig[type as keyof typeof tokenTypeConfig]?.label || type,
      value: amount,
      color: tokenTypeConfig[type as keyof typeof tokenTypeConfig]?.color || "#888",
    }));
    return { total, byType, pieData, count: allTokens.length };
  }, [allTokens]);

  // Monthly trend
  const trendData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    allTokens.forEach((t: any) => {
      const month = new Date(t.minted_at).toISOString().slice(0, 7);
      monthMap[month] = (monthMap[month] || 0) + t.amount;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));
  }, [allTokens]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 md:px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                Impact Token Marketplace
              </h1>
              <p className="text-muted-foreground">
                Browse, trade, and manage regenerative impact tokens
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/treasury")} className="gap-2">
                <Coins className="w-4 h-4" /> Treasury
              </Button>
            </div>
          </div>

          {/* Market Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{marketStats.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Supply</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <ShoppingCart className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{marketStats.count}</p>
                    <p className="text-xs text-muted-foreground">Token Batches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Wallet className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{portfolioStats.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">My Holdings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{portfolioStats.count}</p>
                    <p className="text-xs text-muted-foreground">My Tokens</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="browse" className="gap-2">
                <Search className="w-4 h-4" /> Browse
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-2">
                <Wallet className="w-4 h-4" /> My Wallet
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <TrendingUp className="w-4 h-4" /> Analytics
              </TabsTrigger>
            </TabsList>

            {/* BROWSE TAB */}
            <TabsContent value="browse">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by region or type..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(tokenTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Card className="bg-card border-border/50">
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : filteredTokens.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No tokens found</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount (RCI)</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Minted</TableHead>
                            <TableHead>Tx Hash</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTokens.slice(0, 50).map((token: any) => {
                            const config = tokenTypeConfig[token.token_type as keyof typeof tokenTypeConfig];
                            const Icon = config?.icon || Coins;
                            return (
                              <TableRow key={token.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-md ${config?.bg}`}>
                                      <Icon className="w-4 h-4" style={{ color: config?.color }} />
                                    </div>
                                    <span className="capitalize font-medium">{token.token_type}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono font-semibold">
                                  {token.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{token.region_name}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {formatDistanceToNow(new Date(token.minted_at), { addSuffix: true })}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {token.transaction_hash
                                    ? `${token.transaction_hash.slice(0, 8)}...${token.transaction_hash.slice(-6)}`
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedToken(token);
                                      setTransferDialogOpen(true);
                                    }}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* WALLET TAB */}
            <TabsContent value="wallet">
              <div className="space-y-6">
                {/* Wallet Balance Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(tokenTypeConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const amount = portfolioStats[key as keyof typeof portfolioStats] as number || 0;
                    return (
                      <Card key={key} className="bg-card border-border/50">
                        <CardContent className="p-4 text-center">
                          <div className={`inline-flex p-3 rounded-xl ${config.bg} mb-3`}>
                            <Icon className="w-6 h-6" style={{ color: config.color }} />
                          </div>
                          <p className="text-2xl font-display font-bold">{amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{config.label}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* My Tokens Table */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">My Token Holdings</CardTitle>
                    <CardDescription>Tokens you have minted or received</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {myTokens.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wallet className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No tokens in your wallet yet</p>
                        <p className="text-sm mt-1">Mint tokens through the verification workflow</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Minted</TableHead>
                            <TableHead>Hash</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myTokens.map((token: any) => {
                            const config = tokenTypeConfig[token.token_type as keyof typeof tokenTypeConfig];
                            const Icon = config?.icon || Coins;
                            return (
                              <TableRow key={token.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" style={{ color: config?.color }} />
                                    <span className="capitalize">{token.token_type}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono font-semibold">
                                  {Number(token.amount).toLocaleString()}
                                </TableCell>
                                <TableCell>{token.region?.region_name || "Unknown"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(token.minted_at), { addSuffix: true })}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {token.transaction_hash?.slice(0, 10) || "—"}...
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Minting Volume Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
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
                            dataKey="amount"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary) / 0.2)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Market Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={marketStats.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {marketStats.pieData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => value.toLocaleString()}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Top regions by tokens */}
                <Card className="bg-card border-border/50 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Market Activity Feed</CardTitle>
                    <CardDescription>Recent token minting events across the network</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {allTokens.slice(0, 20).map((token: any) => {
                        const config = tokenTypeConfig[token.token_type as keyof typeof tokenTypeConfig];
                        const Icon = config?.icon || Coins;
                        return (
                          <div
                            key={token.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${config?.bg}`}>
                                <Icon className="w-4 h-4" style={{ color: config?.color }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {token.amount.toLocaleString()} RCI <span className="capitalize">{token.token_type}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">{token.region_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1 text-primary" />
                                Minted
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(token.minted_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Token Detail Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token Details</DialogTitle>
            <DialogDescription>View and manage this impact token</DialogDescription>
          </DialogHeader>
          {selectedToken && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{selectedToken.token_type}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold">{selectedToken.amount.toLocaleString()} RCI</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Region</p>
                  <p className="font-semibold">{selectedToken.region_name}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Minted</p>
                  <p className="font-semibold text-sm">
                    {formatDistanceToNow(new Date(selectedToken.minted_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {selectedToken.transaction_hash && (
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                  <p className="font-mono text-xs break-all">{selectedToken.transaction_hash}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
