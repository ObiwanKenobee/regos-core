import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, Globe, Leaf, Waves, Heart, Recycle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  last_updated: string | null;
}

// Simplified world map paths for major regions
const regionPaths: Record<string, { d: string; center: [number, number] }> = {
  NA: {
    d: "M100,80 L180,60 L220,80 L230,140 L200,180 L140,190 L100,160 L80,120 Z",
    center: [150, 120],
  },
  SA: {
    d: "M160,200 L200,190 L220,240 L200,320 L170,340 L140,300 L150,240 Z",
    center: [175, 260],
  },
  EU: {
    d: "M420,60 L480,50 L520,70 L510,120 L460,130 L420,100 Z",
    center: [470, 90],
  },
  AF: {
    d: "M420,140 L500,130 L520,180 L500,280 L450,300 L400,260 L410,180 Z",
    center: [460, 210],
  },
  AS: {
    d: "M520,40 L700,30 L740,100 L720,180 L620,200 L540,160 L520,100 Z",
    center: [630, 110],
  },
  OC: {
    d: "M680,260 L760,240 L800,280 L780,320 L720,330 L680,300 Z",
    center: [740, 285],
  },
};

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

const getScoreColor = (score: number) => {
  if (score >= 75) return "fill-emerald-500/80 stroke-emerald-400";
  if (score >= 60) return "fill-teal-500/70 stroke-teal-400";
  if (score >= 45) return "fill-amber-500/70 stroke-amber-400";
  return "fill-red-500/60 stroke-red-400";
};

const RCIWorldMap = () => {
  const [regions, setRegions] = useState<RCIRegion[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<RCIRegion | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RCIRegion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase
        .from("rci_regions")
        .select("*")
        .in("region_code", Object.keys(regionPaths));

      if (!error && data) {
        setRegions(data);
      }
      setLoading(false);
    };

    fetchRegions();
  }, []);

  const getRegionData = (code: string) => regions.find((r) => r.region_code === code);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow opacity-30" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Global RCI Intelligence</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Regenerative Capacity
            <span className="text-gradient-primary"> World Map</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time visualization of planetary regenerative capacity. Hover over regions to explore metrics, click for detailed breakdown.
          </p>
        </motion.div>

        <div className="relative">
          {/* Legend */}
          <div className="absolute top-4 left-4 z-20 glass rounded-xl p-4">
            <div className="text-xs font-medium mb-3 text-foreground">RCI Score Legend</div>
            <div className="space-y-2">
              {[
                { label: "High (75+)", color: "bg-emerald-500" },
                { label: "Good (60-74)", color: "bg-teal-500" },
                { label: "Moderate (45-59)", color: "bg-amber-500" },
                { label: "Low (<45)", color: "bg-red-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass rounded-2xl p-6 overflow-hidden"
          >
            {loading ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="text-muted-foreground">Loading global RCI data...</div>
              </div>
            ) : (
              <svg
                viewBox="0 0 900 400"
                className="w-full h-auto"
                style={{ minHeight: "400px" }}
              >
                {/* Background gradient */}
                <defs>
                  <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(165 60% 45% / 0.1)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect fill="url(#mapGlow)" width="900" height="400" />

                {/* Grid lines */}
                {[...Array(9)].map((_, i) => (
                  <line
                    key={`v${i}`}
                    x1={i * 100 + 50}
                    y1="0"
                    x2={i * 100 + 50}
                    y2="400"
                    stroke="hsl(220 15% 20% / 0.3)"
                    strokeWidth="0.5"
                  />
                ))}
                {[...Array(4)].map((_, i) => (
                  <line
                    key={`h${i}`}
                    x1="0"
                    y1={i * 100 + 50}
                    x2="900"
                    y2={i * 100 + 50}
                    stroke="hsl(220 15% 20% / 0.3)"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Region paths */}
                {Object.entries(regionPaths).map(([code, { d, center }]) => {
                  const regionData = getRegionData(code);
                  const score = regionData?.rci_score ?? 50;
                  const isHovered = hoveredRegion?.region_code === code;
                  const isSelected = selectedRegion?.region_code === code;

                  return (
                    <g key={code}>
                      <motion.path
                        d={d}
                        className={`${getScoreColor(score)} cursor-pointer transition-all duration-300`}
                        strokeWidth={isHovered || isSelected ? 3 : 1.5}
                        filter={isHovered || isSelected ? "url(#glow)" : undefined}
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: 1,
                          scale: isHovered ? 1.02 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        onMouseEnter={() => regionData && setHoveredRegion(regionData)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        onClick={() => regionData && setSelectedRegion(regionData)}
                      />
                      {/* Region label */}
                      <text
                        x={center[0]}
                        y={center[1]}
                        textAnchor="middle"
                        className="fill-foreground text-xs font-medium pointer-events-none"
                        style={{ fontSize: "10px" }}
                      >
                        {code}
                      </text>
                      {/* RCI Score badge */}
                      <g transform={`translate(${center[0] - 15}, ${center[1] + 10})`}>
                        <rect
                          width="30"
                          height="16"
                          rx="4"
                          className="fill-background/80"
                        />
                        <text
                          x="15"
                          y="12"
                          textAnchor="middle"
                          className="fill-primary text-xs font-bold"
                          style={{ fontSize: "9px" }}
                        >
                          {score.toFixed(1)}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            )}
          </motion.div>

          {/* Hover Tooltip */}
          <AnimatePresence>
            {hoveredRegion && !selectedRegion && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-4 right-4 glass rounded-xl p-4 min-w-[240px] z-30"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold">{hoveredRegion.region_name}</h3>
                  {getTrendIcon(hoveredRegion.rci_trend)}
                </div>
                <div className="text-3xl font-bold text-gradient-primary mb-2">
                  {hoveredRegion.rci_score.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Click for detailed breakdown
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Region Detail Panel */}
          <AnimatePresence>
            {selectedRegion && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-4 right-4 glass rounded-2xl p-6 w-80 z-30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold">{selectedRegion.region_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>RCI Trend</span>
                      {getTrendIcon(selectedRegion.rci_trend)}
                      <span className="capitalize">{selectedRegion.rci_trend || "stable"}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedRegion(null)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-4xl font-bold text-gradient-primary mb-6">
                  {selectedRegion.rci_score.toFixed(1)}
                  <span className="text-sm text-muted-foreground font-normal ml-2">/ 100</span>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Capacity Breakdown</h4>
                  
                  {[
                    { label: "Land Capacity", value: selectedRegion.land_capacity, icon: <Leaf className="w-4 h-4" /> },
                    { label: "Ocean Capacity", value: selectedRegion.ocean_capacity, icon: <Waves className="w-4 h-4" /> },
                    { label: "Human Capacity", value: selectedRegion.human_capacity, icon: <Heart className="w-4 h-4" /> },
                    { label: "Circular Economy", value: selectedRegion.circular_capacity, icon: <Recycle className="w-4 h-4" /> },
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {metric.icon}
                          <span>{metric.label}</span>
                        </div>
                        <span className="font-medium text-foreground">
                          {(metric.value ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value ?? 0}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button className="w-full" variant="default">
                    View Full Analytics
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default RCIWorldMap;
