import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Globe, MapPin, TrendingUp } from "lucide-react";

interface RegionData {
  region: string;
  amount: number;
  percentage?: number;
}

interface AllocationProps {
  byRegion: RegionData[];
  totalTokens: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(200, 60%, 50%)",
  "hsl(38, 90%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(160, 60%, 50%)",
  "hsl(340, 60%, 55%)",
];

export const RegionalAllocation = ({ byRegion, totalTokens }: AllocationProps) => {
  const dataWithPercentage = byRegion.map((r) => ({
    ...r,
    percentage: totalTokens > 0 ? ((r.amount / totalTokens) * 100).toFixed(1) : "0",
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card className="glass-strong border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Regional Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataWithPercentage}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="amount"
                  nameKey="region"
                  label={({ region, percentage }) => `${region}: ${percentage}%`}
                  labelLine={false}
                >
                  {dataWithPercentage.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()} tokens`, "Amount"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card className="glass-strong border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Holdings by Region
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataWithPercentage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="region"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={100}
                  tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
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

      {/* Region Stats */}
      <Card className="glass-strong border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Regional Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dataWithPercentage.slice(0, 5).map((region, index) => (
              <div
                key={region.region}
                className="p-4 rounded-xl border border-border bg-secondary/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-sm truncate">{region.region}</span>
                </div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {region.amount.toLocaleString()}
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {region.percentage}% of portfolio
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionalAllocation;
