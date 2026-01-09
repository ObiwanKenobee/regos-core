import { motion } from "framer-motion";
import { Activity, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

const metrics = [
  {
    label: "Global RCI",
    value: "67.4",
    change: "+2.3%",
    trend: "up",
    description: "Regenerative Capacity Index",
  },
  {
    label: "ΔRCI Trajectory",
    value: "+0.8",
    change: "Improving",
    trend: "up",
    description: "Annual capacity change",
  },
  {
    label: "Volatility Index",
    value: "12.1",
    change: "Low Risk",
    trend: "stable",
    description: "Governance stability metric",
  },
  {
    label: "Active Stewards",
    value: "2.4M",
    change: "+18%",
    trend: "up",
    description: "Global steward network",
  },
];

const RCISection = () => {
  return (
    <section className="py-32 bg-card relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full">
          <pattern id="rci-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="currentColor" className="text-primary" />
          </pattern>
          <rect fill="url(#rci-grid)" width="100%" height="100%" />
        </svg>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm text-primary font-medium uppercase tracking-widest mb-4 block">
              Intelligence Engine
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              RCI: The Brain of <br />
              <span className="text-gradient-primary">Atlas Sanctum</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              The Regenerative Capacity Index synthesizes satellite data, IoT sensors, 
              public health systems, and fiscal data into actionable intelligence—making 
              regenerative capacity <span className="text-foreground">measurable, investable, and governable</span>.
            </p>

            <div className="space-y-4">
              {[
                { icon: BarChart3, text: "National, biome, and population-level metrics" },
                { icon: TrendingUp, text: "Scenario simulation for policy × capital × climate" },
                { icon: AlertTriangle, text: "Early-warning signals for systemic risks" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Metrics dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Dashboard container */}
            <div className="glass-strong rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="font-display font-semibold text-foreground">
                    RCI Dashboard
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Live • Updated 2s ago
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    className="p-4 rounded-xl bg-secondary/50 border border-border/50"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {metric.label}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-display font-bold text-foreground">
                        {metric.value}
                      </span>
                      <span className={`text-xs font-medium ${
                        metric.trend === "up" ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      {metric.description}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Mini chart visualization */}
              <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">
                    Global Capacity Trend
                  </span>
                  <span className="text-xs text-primary">+12.4% YoY</span>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {[40, 45, 42, 55, 52, 60, 58, 65, 70, 68, 75, 72].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-primary/60 to-primary rounded-t"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating accent elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RCISection;
