import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Table2,
  MapPin,
  AlertTriangle,
  Leaf,
  Waves,
  Heart,
  Recycle,
  LogOut,
  User,
  Home,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RCIRegion {
  id: string;
  region_code: string;
  region_name: string;
  rci_score: number;
  rci_trend: string | null;
  land_capacity: number | null;
  ocean_capacity: number | null;
  human_capacity: number | null;
  circular_capacity: number | null;
}

const mockTimeSeriesData = [
  { month: "Jan", rci: 62.4, land: 65.2, ocean: 58.1, human: 61.8, circular: 54.3 },
  { month: "Feb", rci: 63.1, land: 66.4, ocean: 59.2, human: 62.1, circular: 55.8 },
  { month: "Mar", rci: 64.8, land: 68.1, ocean: 60.4, human: 63.5, circular: 57.2 },
  { month: "Apr", rci: 65.2, land: 69.2, ocean: 61.8, human: 64.2, circular: 58.1 },
  { month: "May", rci: 66.9, land: 71.4, ocean: 62.5, human: 65.8, circular: 59.4 },
  { month: "Jun", rci: 68.4, land: 73.2, ocean: 64.1, human: 67.2, circular: 61.2 },
];

const COLORS = ["hsl(165, 60%, 45%)", "hsl(200, 60%, 50%)", "hsl(38, 90%, 55%)", "hsl(280, 60%, 55%)"];

const getTrendIcon = (trend: string | null) => {
  switch (trend) {
    case "improving":
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case "declining":
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    default:
      return <Minus className="w-4 h-4 text-amber-400" />;
  }
};

const Dashboard = () => {
  const { user, roles, loading, signOut } = useAuth();
  const [regions, setRegions] = useState<RCIRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RCIRegion | null>(null);
  const [view, setView] = useState<"charts" | "table">("charts");

  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase
        .from("rci_regions")
        .select("*")
        .order("rci_score", { ascending: false });

      if (!error && data) {
        setRegions(data);
        if (data.length > 0) {
          setSelectedRegion(data[0]);
        }
      }
    };

    if (user) {
      fetchRegions();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const globalAvgRCI = regions.length > 0
    ? (regions.reduce((sum, r) => sum + r.rci_score, 0) / regions.length).toFixed(1)
    : "0.0";

  const improvingCount = regions.filter((r) => r.rci_trend === "improving").length;
  const decliningCount = regions.filter((r) => r.rci_trend === "declining").length;

  const pieData = selectedRegion
    ? [
        { name: "Land", value: selectedRegion.land_capacity ?? 0 },
        { name: "Ocean", value: selectedRegion.ocean_capacity ?? 0 },
        { name: "Human", value: selectedRegion.human_capacity ?? 0 },
        { name: "Circular", value: selectedRegion.circular_capacity ?? 0 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-semibold text-foreground">
                  Atlas Sanctum
                </span>
              </a>
              <div className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="capitalize">{roles[0] || "User"}</span> Dashboard
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <a href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </a>
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm hidden md:inline">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 md:px-6 py-8">
        {/* Header Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Globe className="w-4 h-4" />
              Global Average RCI
            </div>
            <div className="text-3xl font-bold text-gradient-primary">{globalAvgRCI}</div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <MapPin className="w-4 h-4" />
              Regions Tracked
            </div>
            <div className="text-3xl font-bold text-foreground">{regions.length}</div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Improving
            </div>
            <div className="text-3xl font-bold text-emerald-400">{improvingCount}</div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              At Risk
            </div>
            <div className="text-3xl font-bold text-red-400">{decliningCount}</div>
          </div>
        </motion.div>

        {/* View Toggle & Region Selector */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={view === "charts" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("charts")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Charts
            </Button>
            <Button
              variant={view === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("table")}
            >
              <Table2 className="w-4 h-4 mr-2" />
              Data Table
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Focus Region:</span>
            <select
              value={selectedRegion?.id || ""}
              onChange={(e) => {
                const region = regions.find((r) => r.id === e.target.value);
                setSelectedRegion(region || null);
              }}
              className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm"
            >
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {view === "charts" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main RCI Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 glass rounded-2xl p-6"
            >
              <h3 className="font-display text-lg font-semibold mb-4">
                RCI Trend — {selectedRegion?.region_name || "Global"}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockTimeSeriesData}>
                  <defs>
                    <linearGradient id="rciGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(165, 60%, 45%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(165, 60%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                  <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} domain={[50, 80]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 20%, 10%)",
                      border: "1px solid hsl(220, 15%, 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rci"
                    stroke="hsl(165, 60%, 45%)"
                    strokeWidth={2}
                    fill="url(#rciGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Capacity Breakdown Pie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="font-display text-lg font-semibold mb-4">Capacity Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name }) => name}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[
                  { label: "Land", icon: <Leaf className="w-3 h-3" />, color: COLORS[0] },
                  { label: "Ocean", icon: <Waves className="w-3 h-3" />, color: COLORS[1] },
                  { label: "Human", icon: <Heart className="w-3 h-3" />, color: COLORS[2] },
                  { label: "Circular", icon: <Recycle className="w-3 h-3" />, color: COLORS[3] },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.icon}
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sector Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 glass rounded-2xl p-6"
            >
              <h3 className="font-display text-lg font-semibold mb-4">Sector Trends</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                  <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} domain={[50, 80]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 20%, 10%)",
                      border: "1px solid hsl(220, 15%, 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="land" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ocean" stroke={COLORS[1]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="human" stroke={COLORS[2]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="circular" stroke={COLORS[3]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Regional Rankings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="font-display text-lg font-semibold mb-4">Regional Rankings</h3>
              <div className="space-y-3">
                {regions.slice(0, 5).map((region, index) => (
                  <div
                    key={region.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRegion?.id === region.id
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedRegion(region)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{region.region_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{region.rci_score.toFixed(1)}</span>
                      {getTrendIcon(region.rci_trend)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Data Table View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Region</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">RCI Score</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Trend</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Land</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Ocean</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Human</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Circular</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((region, index) => (
                    <tr
                      key={region.id}
                      className={`border-t border-border/50 ${
                        index % 2 === 0 ? "bg-card/30" : ""
                      } hover:bg-muted/30 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{region.region_name}</span>
                          <span className="text-xs text-muted-foreground">({region.region_code})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-primary">{region.rci_score.toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(region.rci_trend)}
                          <span className="text-sm capitalize">{region.rci_trend || "stable"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {(region.land_capacity ?? 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {(region.ocean_capacity ?? 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {(region.human_capacity ?? 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {(region.circular_capacity ?? 0).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
