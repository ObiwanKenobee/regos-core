import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, Download, PieChart as PieChartIcon, Coins, Banknote,
  MapPin, TrendingUp, Wallet, Leaf, Waves, Heart, Recycle,
  ArrowUpRight, ArrowDownRight, DollarSign, BarChart3, Activity,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { RoleDashboardHeader } from "@/components/dashboard/RoleDashboardHeader";
import { InvestmentOpportunities } from "@/components/investor";
import { exportAnalyticsToCSV } from "@/utils/exportData";
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

const TOKEN_VALUES: Record<string, number> = { land: 25, ocean: 30, health: 35, circular: 20 };
const CAPACITY_COLORS: Record<string, string> = {
  land: "hsl(142, 71%, 45%)",
  ocean: "hsl(217, 91%, 60%)",
  health: "hsl(347, 77%, 50%)",
  circular: "hsl(271, 91%, 65%)",
};

const tabs = [
  { id: "overview", label: "Portfolio", icon: PieChartIcon },
  { id: "opportunities", label: "Bond Market", icon: Banknote },
  { id: "allocation", label: "Allocation", icon: MapPin },
  { id: "holdings", label: "Holdings", icon: Coins },
  { id: "analytics", label: "Analytics", icon: Activity },
];

const InvestorDashboard = () => {
  const { user, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<TokenHolding[]>([]);
  const [bonds, setBonds] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const isInvestor = roles.includes("investor") || roles.includes("admin");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && !isInvestor) {
      toast({ title: "Access Denied", description: "Investor privileges required.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [user, roles, loading, navigate, isInvestor]);

  useEffect(() => {
    if (isInvestor && user) {
      fetchData();
      const channel = supabase
        .channel("investor-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "impact_tokens" }, () => fetchData())
        .on("postgres_changes", { event: "*", schema: "public", table: "sovereign_bonds" }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isInvestor, user]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [tokensRes, bondsRes] = await Promise.all([
        supabase.from("impact_tokens").select("id, token_type, amount, minted_at, region:rci_regions(region_name, region_code)").order("minted_at", { ascending: false }),
        supabase.from("sovereign_bonds").select("id, bond_name, bond_type, principal_amount, coupon_rate, status, maturity_date, region:rci_regions(region_name, rci_score)").order("created_at", { ascending: false }).limit(20),
      ]);
      if (tokensRes.error) throw tokensRes.error;
      setTokens((tokensRes.data || []).map((t: any) => ({
        id: t.id, token_type: t.token_type, amount: t.amount, minted_at: t.minted_at,
        region_name: t.region?.region_name || "Unknown", region_code: t.region?.region_code || "N/A",
      })));
      setBonds(bondsRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleExport = () => {
    if (tokens.length === 0) { toast({ title: "No data", variant: "destructive" }); return; }
    exportAnalyticsToCSV(tokens.map((t): Record<string, unknown> => ({
      Type: t.token_type, Amount: t.amount, Value: t.amount * TOKEN_VALUES[t.token_type],
      Region: t.region_name, "Minted At": new Date(t.minted_at).toLocaleString(),
    })), `investor-portfolio-${new Date().toISOString().split("T")[0]}`);
    toast({ title: "Exported" });
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!isInvestor) return null;

  // Portfolio computations
  const byType = ["land", "ocean", "health", "circular"].map((type) => {
    const amount = tokens.filter((t) => t.token_type === type).reduce((s, t) => s + t.amount, 0);
    return { type, name: type.charAt(0).toUpperCase() + type.slice(1), amount, value: amount * TOKEN_VALUES[type] };
  });
  const totalTokens = tokens.reduce((s, t) => s + t.amount, 0);
  const totalValue = byType.reduce((s, t) => s + t.value, 0);
  const activeBonds = bonds.filter((b) => b.status === "active").length;
  const totalBondValue = bonds.filter((b) => b.status === "active").reduce((s, b) => s + b.principal_amount, 0);

  // Region aggregation
  const regionMap = new Map<string, number>();
  tokens.forEach((t) => regionMap.set(t.region_name, (regionMap.get(t.region_name) || 0) + t.amount));
  const byRegion = Array.from(regionMap.entries()).map(([region, amount]) => ({ region, amount })).sort((a, b) => b.amount - a.amount).slice(0, 10);

  // Time series (group by month)
  const monthMap = new Map<string, Record<string, number>>();
  tokens.forEach((t) => {
    const month = format(new Date(t.minted_at), "MMM yy");
    if (!monthMap.has(month)) monthMap.set(month, { land: 0, ocean: 0, health: 0, circular: 0 });
    const m = monthMap.get(month)!;
    m[t.token_type] = (m[t.token_type] || 0) + t.amount;
  });
  const timeData = Array.from(monthMap.entries()).map(([month, data]) => ({ month, ...data }));

  return (
    <div className="min-h-screen bg-background">
      <RoleDashboardHeader
        userEmail={user?.email || ""}
        roles={roles}
        currentRole="investor"
        isRealtimeActive={!isLoadingData}
        onSignOut={async () => { await signOut(); navigate("/auth"); }}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="Investor Portal"
        accentColor="from-emerald-500 to-teal-600"
        accentIcon={TrendingUp}
      />

      <main className="container px-4 md:px-6 py-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Portfolio Value", value: `$${totalValue.toLocaleString()}`, icon: DollarSign, accent: true },
            { label: "Total Tokens", value: totalTokens.toLocaleString(), icon: Coins },
            { label: "Active Bonds", value: activeBonds.toString(), icon: Banknote },
            { label: "Bond Exposure", value: `$${(totalBondValue / 1_000_000).toFixed(1)}M`, icon: BarChart3 },
            { label: "Impact Score", value: `${Math.min(100, Math.floor(totalTokens / 10))}`, icon: Leaf, accent: true },
          ].map((kpi) => (
            <Card key={kpi.label} className="glass-strong border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`w-4 h-4 ${kpi.accent ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className={`text-2xl font-display font-bold ${kpi.accent ? "text-primary" : "text-foreground"}`}>
                  {kpi.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export bar */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Token distribution pie */}
              <Card className="glass-strong border-border/50 lg:col-span-1">
                <CardHeader><CardTitle className="text-sm">Token Distribution</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={byType.filter(d => d.amount > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {byType.map((entry) => <Cell key={entry.type} fill={CAPACITY_COLORS[entry.type]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Acquisition trend */}
              <Card className="glass-strong border-border/50 lg:col-span-2">
                <CardHeader><CardTitle className="text-sm">Token Acquisition Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Legend />
                        <Area type="monotone" dataKey="land" stackId="1" fill={CAPACITY_COLORS.land} stroke={CAPACITY_COLORS.land} fillOpacity={0.6} />
                        <Area type="monotone" dataKey="ocean" stackId="1" fill={CAPACITY_COLORS.ocean} stroke={CAPACITY_COLORS.ocean} fillOpacity={0.6} />
                        <Area type="monotone" dataKey="health" stackId="1" fill={CAPACITY_COLORS.health} stroke={CAPACITY_COLORS.health} fillOpacity={0.6} />
                        <Area type="monotone" dataKey="circular" stackId="1" fill={CAPACITY_COLORS.circular} stroke={CAPACITY_COLORS.circular} fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Capacity breakdown cards */}
              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                {byType.map((t) => {
                  const Icon = t.type === "land" ? Leaf : t.type === "ocean" ? Waves : t.type === "health" ? Heart : Recycle;
                  return (
                    <Card key={t.type} className="glass-strong border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${CAPACITY_COLORS[t.type]}20` }}>
                            <Icon className="w-4 h-4" style={{ color: CAPACITY_COLORS[t.type] }} />
                          </div>
                          <span className="text-sm font-medium capitalize">{t.type}</span>
                        </div>
                        <p className="text-xl font-display font-bold text-foreground">{t.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">${t.value.toLocaleString()} value</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "opportunities" && <InvestmentOpportunities />}

          {activeTab === "allocation" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-strong border-border/50">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Regional Distribution</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={byRegion} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="amount" nameKey="region"
                          label={({ region, percent }) => `${region.slice(0, 10)} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {byRegion.map((_, i) => <Cell key={i} fill={`hsl(${165 + i * 30}, 60%, ${45 + i * 5}%)`} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-strong border-border/50">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Holdings by Region</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={byRegion} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis type="category" dataKey="region" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100}
                          tickFormatter={(v) => v.length > 12 ? `${v.slice(0, 12)}…` : v} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "holdings" && <HoldingsTable tokens={tokens} />}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-strong border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Bond Portfolio Status</CardTitle>
                  <CardDescription>{bonds.length} bonds tracked</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Bond</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead>Coupon</TableHead>
                          <TableHead>Region RCI</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bonds.slice(0, 10).map((bond: any) => (
                          <TableRow key={bond.id}>
                            <TableCell className="font-medium">{bond.bond_name}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{bond.bond_type}</Badge></TableCell>
                            <TableCell className="font-mono">${(bond.principal_amount / 1_000_000).toFixed(1)}M</TableCell>
                            <TableCell className="font-mono text-primary">{bond.coupon_rate}%</TableCell>
                            <TableCell>
                              {bond.region?.rci_score ? (
                                <div className="flex items-center gap-2">
                                  <Progress value={bond.region.rci_score} className="w-16 h-2" />
                                  <span className="text-xs font-mono">{bond.region.rci_score.toFixed(1)}%</span>
                                </div>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge className={bond.status === "active" ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}>
                                {bond.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

const HoldingsTable = ({ tokens }: { tokens: TokenHolding[] }) => {
  const { paginatedData, currentPage, totalPages, goToPage, nextPage, prevPage, startIndex, endIndex, totalItems, itemsPerPage, setItemsPerPage } = usePagination({ data: tokens, itemsPerPage: 10 });
  const getIcon = (type: string) => {
    switch (type) {
      case "land": return <Leaf className="w-4 h-4" style={{ color: CAPACITY_COLORS.land }} />;
      case "ocean": return <Waves className="w-4 h-4" style={{ color: CAPACITY_COLORS.ocean }} />;
      case "health": return <Heart className="w-4 h-4" style={{ color: CAPACITY_COLORS.health }} />;
      case "circular": return <Recycle className="w-4 h-4" style={{ color: CAPACITY_COLORS.circular }} />;
      default: return <Coins className="w-4 h-4" />;
    }
  };
  return (
    <Card className="glass-strong border-border/50">
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Coins className="w-4 h-4 text-primary" />Token Holdings</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Value</TableHead><TableHead>Region</TableHead><TableHead>Minted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((token) => (
                <TableRow key={token.id}>
                  <TableCell><div className="flex items-center gap-2">{getIcon(token.token_type)}<Badge variant="outline" className="capitalize">{token.token_type}</Badge></div></TableCell>
                  <TableCell className="font-mono">{token.amount.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-primary">${(token.amount * TOKEN_VALUES[token.token_type]).toLocaleString()}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Badge variant="secondary" className="font-mono text-xs">{token.region_code}</Badge><span className="text-muted-foreground">{token.region_name}</span></div></TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(token.minted_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} onNextPage={nextPage} onPrevPage={prevPage}
          startIndex={startIndex} endIndex={endIndex} totalItems={totalItems} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} />
      </CardContent>
    </Card>
  );
};

export default InvestorDashboard;
