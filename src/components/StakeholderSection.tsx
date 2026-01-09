import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Crown, LineChart, FlaskConical, Users, ArrowRight } from "lucide-react";

const stakeholders = [
  {
    icon: Crown,
    title: "Sovereigns",
    description: "Nations and territories seeking to measure, certify, and monetize regenerative capacity through RCI-linked instruments.",
    features: ["RCI National Dashboard", "Sovereign Bond Issuance", "Policy Simulation"],
    cta: "For Governments",
  },
  {
    icon: LineChart,
    title: "Investors",
    description: "Institutions and funds deploying capital into verified, capacity-backed regenerative assets with measurable outcomes.",
    features: ["Portfolio Analytics", "Impact Verification", "Risk Assessment"],
    cta: "For Capital",
  },
  {
    icon: FlaskConical,
    title: "Scientists",
    description: "Researchers and data stewards contributing to the RCI methodology and global regenerative intelligence commons.",
    features: ["Data Contribution", "Model Access", "Peer Review"],
    cta: "For Research",
  },
  {
    icon: Users,
    title: "Communities",
    description: "Local stewards and indigenous groups governing regenerative projects through sovereign community vaults.",
    features: ["Micro-Capital Access", "Land Registry", "Benefit Sharing"],
    cta: "For Stewards",
  },
];

const StakeholderSection = () => {
  return (
    <section className="py-32 bg-background relative">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm text-accent font-medium uppercase tracking-widest mb-4 block">
            Steward Pathways
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Not Users. <span className="text-gradient-accent">Stewards.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Atlas Sanctum serves those who serve regeneration—from sovereign nations 
            to local communities, from institutional capital to frontier science.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stakeholders.map((stakeholder, index) => (
            <motion.div
              key={stakeholder.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-card-gradient border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card flex flex-col">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
                  <stakeholder.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  {stakeholder.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-5 flex-1">
                  {stakeholder.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {stakeholder.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button variant="ghost" className="w-full justify-between group/btn">
                  {stakeholder.cta}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StakeholderSection;
