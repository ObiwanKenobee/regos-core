import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Coins,
  TreeDeciduous,
  Droplets,
  Activity,
  Repeat,
  Download,
  TrendingUp,
  Calendar,
  Globe,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { exportToCSV } from "@/utils/exportData";

const tokenTypeConfig = {
  land: { icon: TreeDeciduous, color: "#22c55e", label: "Land" },
  ocean: { icon: Droplets, color: "#3b82f6", label: "Ocean" },
  health: { icon: Activity, color: "#f43f5e", label: "Health" },
  circular: { icon: Repeat, color: "#a855f7", label: "Circular" },
};

const Treasury = () => {
  const [timePeriod, setTimePeriod] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const { data: tokens = [], isLoading: tokensLoading } = useQuery({
    queryKey: ["treasury-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("impact_tokens")
        .select(`
          *,
          region:rci_regions(region_name, region_code)
        `)
        .order("minted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["treasury-regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rci_regions")
        .select("id, region_name, region_code")
        .order("region_name");
      if (error) throw error;
      return data;
    },
  });

  const filteredTokens = useMemo(() => {
    let filtered = [...tokens];

    // Time period filter
    if (timePeriod !== "all") {
      const now = new Date();
      const cutoff = new Date();
      switch (timePeriod) {
        case "7d":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "30d":
          cutoff.setDate(now.getDate() - 30);
          break;
        case "90d":
          cutoff.setDate(now.getDate() - 90);
          break;
        case "1y":
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }
      filtered = filtered.filter((t) => new Date(t.minted_at) >= cutoff);
    }

    // Region filter
    if (selectedRegion !== "all") {
      filtered = filtered.filter((t) => t.region_id === selectedRegion);
    }

    return filtered;
  }, [tokens, timePeriod, selectedRegion]);

  // Stats by type
  const statsByType = useMemo(() => {
    const stats: Record<string, number> = { land: 0, ocean: 0, health: 0, circular: 0 };
    filteredTokens.forEach((t) => {
      if (stats[t.token_type] !== undefined) {
        stats[t.token_type] += Number(t.amount);
      }
    });
    return Object.entries(stats).map(([type, amount]) => ({
      type,
      amount,
      ...tokenTypeConfig[type as keyof typeof tokenTypeConfig],
    }));
  }, [filteredTokens]);

  // Stats by region
  const statsByRegion = useMemo(() => {
    const regionMap: Record<string, { name: string; amount: number }> = {};
    filteredTokens.forEach((t) => {
      const regionName = t.region?.region_name || "Unknown";
      if (!regionMap[t.region_id]) {
        regionMap[t.region_id] = { name: regionName, amount: 0 };
      }
      regionMap[t.region_id].amount += Number(t.amount);
    });
    return Object.entries(regionMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTokens]);

  // Stats over time (monthly)
  const statsOverTime = useMemo(() => {
    const monthMap: Record<string, Record<string, number>> = {};
    filteredTokens.forEach((t) => {
      const month = new Date(t.minted_at).toISOString().slice(0, 7);
      if (!monthMap[month]) {
        monthMap[month] = { land: 0, ocean: 0, health: 0, circular: 0 };
      }
      monthMap[month][t.token_type] = (monthMap[month][t.token_type] || 0) + Number(t.amount);
    });
    return Object.entries(monthMap)
      .map(([month, types]) => ({ month, ...types }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTokens]);

  const totalMinted = filteredTokens.reduce((sum, t) => sum + Number(t.amount), 0);

  const handleExportByType = () => {
    exportToCSV(
      statsByType,
      [
        { key: "label", header: "Token Type" },
        { key: "amount", header: "Total Amount", format: (v) => v.toLocaleString() },
      ],
      "treasury_by_type"
    );
  };

  const handleExportByRegion = () => {
    exportToCSV(
      statsByRegion,
      [
        { key: "name", header: "Region" },
        { key: "amount", header: "Total Tokens", format: (v) => v.toLocaleString() },
      ],
      "treasury_by_region"
    );
  };

  const handleExportAll = () => {
    exportToCSV(
      filteredTokens.map((t) => ({
        ...t,
        region_name: t.region?.region_name || "Unknown",
        minted_date: new Date(t.minted_at).toLocaleDateString(),
      })),
      [
        { key: "token_type", header: "Type" },
        { key: "amount", header: "Amount" },
        { key: "region_name", header: "Region" },
        { key: "minted_date", header: "Minted Date" },
        { key: "transaction_hash", header: "Transaction Hash" },
      ],
      "treasury_full_export"
    );
  };

  const COLORS = ["#22c55e", "#3b82f6", "#f43f5e", "#a855f7"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Impact Token Treasury
              </h1>
              <p className="text-muted-foreground">
                Track minted regeneration credits across all regions and time periods
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[180px]">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.region_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExportAll} className="gap-2">
                <Download className="w-4 h-4" />
                Export All
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="glass-strong md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Minted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold text-foreground">
                    {totalMinted.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">RCI Tokens</p>
              </CardContent>
            </Card>

            {statsByType.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.type} className="glass-strong">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                      {stat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                      <span className="text-2xl font-bold text-foreground">
                        {stat.amount.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalMinted > 0 ? ((stat.amount / totalMinted) * 100).toFixed(1) : 0}% of total
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Tabs defaultValue="charts" className="space-y-6">
            <TabsList>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="by-region">By Region</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart by Type */}
                <Card className="glass-strong">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Distribution by Type</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleExportByType}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statsByType.filter((s) => s.amount > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="amount"
                            nameKey="label"
                            label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                          >
                            {statsByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
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

                {/* Line Chart over Time */}
                <Card className="glass-strong">
                  <CardHeader>
                    <CardTitle className="text-lg">Minting Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statsOverTime}>
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
                          <Line type="monotone" dataKey="land" stroke="#22c55e" strokeWidth={2} />
                          <Line type="monotone" dataKey="ocean" stroke="#3b82f6" strokeWidth={2} />
                          <Line type="monotone" dataKey="health" stroke="#f43f5e" strokeWidth={2} />
                          <Line type="monotone" dataKey="circular" stroke="#a855f7" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="by-region">
              <Card className="glass-strong">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Tokens by Region</CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleExportByRegion}>
                    <Download className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsByRegion.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          width={120}
                        />
                        <Tooltip
                          formatter={(value: number) => value.toLocaleString()}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Minted At</TableHead>
                        <TableHead>Transaction Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTokens.slice(0, 20).map((token) => {
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
                            <TableCell className="font-medium">
                              {Number(token.amount).toLocaleString()}
                            </TableCell>
                            <TableCell>{token.region?.region_name || "Unknown"}</TableCell>
                            <TableCell>
                              {new Date(token.minted_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {token.transaction_hash?.slice(0, 10)}...
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Treasury;
