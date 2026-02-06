import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Leaf, Waves, Heart, Recycle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PieDataPoint {
  name: string;
  value: number;
}

interface CapacityBreakdownProps {
  data: PieDataPoint[];
  isLoading: boolean;
}

const COLORS = [
  "hsl(165, 60%, 45%)", // Land - teal
  "hsl(200, 60%, 50%)", // Ocean - blue
  "hsl(38, 90%, 55%)",  // Human - amber
  "hsl(280, 60%, 55%)", // Circular - purple
];

const ICONS = [
  { Icon: Leaf, label: "Land" },
  { Icon: Waves, label: "Ocean" },
  { Icon: Heart, label: "Human" },
  { Icon: Recycle, label: "Circular" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  return (
    <div className="glass rounded-lg p-3 border border-border/50 shadow-xl">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.payload.fill }}
        />
        <span className="font-medium text-foreground">{data.name}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{data.value.toFixed(1)}</p>
    </div>
  );
};

export const CapacityBreakdown = ({ data, isLoading }: CapacityBreakdownProps) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6"
      >
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[200px] w-full rounded-full mx-auto" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl p-6"
    >
      <h3 className="font-display text-lg font-semibold mb-4">Capacity Breakdown</h3>
      
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{total.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {ICONS.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index] }}
            />
            <item.Icon className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.label}</p>
              <p className="text-xs text-muted-foreground">
                {data[index]?.value.toFixed(1) || 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
