import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface TimeSeriesPoint {
  date: string;
  rci: number;
  land: number;
  ocean: number;
  human: number;
  circular: number;
}

interface SectorTrendsChartProps {
  data: TimeSeriesPoint[];
  isLoading: boolean;
}

const SECTOR_COLORS = {
  land: "hsl(165, 60%, 45%)",
  ocean: "hsl(200, 60%, 50%)",
  human: "hsl(38, 90%, 55%)",
  circular: "hsl(280, 60%, 55%)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass rounded-lg p-3 border border-border/50 shadow-xl">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
          <span className="font-medium text-foreground">{entry.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground capitalize">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const SectorTrendsChart = ({ data, isLoading }: SectorTrendsChartProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="lg:col-span-2 glass rounded-2xl p-6"
      >
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="lg:col-span-2 glass rounded-2xl p-6"
    >
      <h3 className="font-display text-lg font-semibold mb-4">Sector Trends</h3>
      
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Line
            type="monotone"
            dataKey="land"
            stroke={SECTOR_COLORS.land}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="ocean"
            stroke={SECTOR_COLORS.ocean}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="human"
            stroke={SECTOR_COLORS.human}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="circular"
            stroke={SECTOR_COLORS.circular}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
