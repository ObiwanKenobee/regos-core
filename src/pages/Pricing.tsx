import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Globe, 
  Building2, 
  TrendingUp, 
  Heart, 
  Lock, 
  CheckCircle2, 
  XCircle,
  Scale,
  Users,
  Landmark,
  Banknote
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Pricing = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              Pricing Strategy
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="text-gradient-primary">"Price Power,</span>
              <br />
              <span className="text-foreground">Not Purpose."</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access to truth must never depend on ability to pay. Atlas Sanctum prices use, 
              leverage, and risk transfer—never ethics, legitimacy, or voice.
            </p>
          </motion.div>
        </div>
      </section>

      {/* First Principle */}
      <section className="py-16 border-y border-border/50">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="glass-strong p-8 rounded-2xl border border-primary/20">
              <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold mb-4 text-foreground">
                First Principle (Non-Negotiable)
              </h2>
              <p className="text-lg text-muted-foreground italic">
                "If truth is paywalled, power buys distortion."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What Is Free */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">Public Goods</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What Is <span className="text-primary">Free</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These components are constitutionally protected and can never be monetized.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {[
              "Regenerative Capacity Intelligence (RCI) methodology (read-only)",
              "Public dashboards (national & regional summaries)",
              "Ethical Constitution and governance rules",
              "Community consent and participation mechanisms",
              "Educational, cultural, and historical map layers"
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="glass p-6 rounded-xl border border-primary/10 flex items-start gap-4"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground/90">{item}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8 text-muted-foreground italic"
          >
            Rationale: Truth must be inspectable by those who live with its consequences.
          </motion.p>
        </div>
      </section>

      {/* What Is Priced */}
      <section className="py-20 bg-card/30">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 border-accent/50 text-accent">The Only Four Things</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What Is <span className="text-accent">Priced</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Atlas Sanctum prices nothing else beyond these four elements.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Scale, label: "Decision Leverage" },
              { icon: Shield, label: "Risk Reduction" },
              { icon: Banknote, label: "Capital Orchestration" },
              { icon: Building2, label: "Institutional Accountability" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-strong p-6 rounded-xl text-center border border-accent/20 hover:border-accent/40 transition-colors"
              >
                <item.icon className="w-10 h-10 text-accent mx-auto mb-4" />
                <span className="font-medium text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8 text-muted-foreground"
          >
            If a buyer seeks influence, priority, or narrative control—<span className="text-foreground font-medium">there is no product for them.</span>
          </motion.p>
        </div>
      </section>

      {/* Core Pricing Layers */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Pricing Tiers</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Core Pricing Layers
            </h2>
          </motion.div>

          <div className="space-y-12 max-w-6xl mx-auto">
            {/* Sovereign & Public Sector */}
            <PricingTier
              number="1"
              icon={Landmark}
              title="Sovereign & Public Sector"
              clients="Governments, ministries, central agencies"
              product="RCI+ (Operational Intelligence Layer)"
              tiers={[
                { tier: "Low-income", fee: "USD 0.5–1.5M" },
                { tier: "Lower-middle", fee: "USD 2–5M" },
                { tier: "Upper-middle", fee: "USD 6–12M" },
                { tier: "High-income", fee: "USD 15–30M" }
              ]}
              includes={[
                "National & subnational RCI diagnostics",
                "Policy sequencing & trade-off simulation",
                "Shock, recovery, and resilience modeling",
                "Results-based financing integration support"
              ]}
              whyPay={[
                "Costs <1% of typical crisis overruns",
                "Replaces fragmented consultant ecosystems",
                "Improves borrowing credibility and investor confidence"
              ]}
              hardRule="Fees may be donor-subsidized, never privately sponsored."
            />

            {/* IFIs & Multilateral Institutions */}
            <PricingTier
              number="2"
              icon={Globe}
              title="IFIs & Multilateral Institutions"
              clients="Multilateral banks, UN-system programs"
              product="RCI Integration & Assurance Layer"
              singleFee="USD 3–10M per major program (multi-year, audit-included)"
              includes={[
                "Independent RCI verification",
                "Results framework alignment",
                "Portfolio-level systemic risk intelligence",
                "Public accountability dashboards"
              ]}
              principle="Atlas Sanctum takes no percentage of lending. It charges only for clarity, verification, and accountability."
            />

            {/* Capital Markets */}
            <PricingTier
              number="3"
              icon={TrendingUp}
              title="Capital Markets & Institutional Investors"
              clients="Pensions, insurers, sovereign wealth funds"
              product="RCI Risk & Recovery Signal"
              usageTiers={[
                { useCase: "Portfolio analytics", fee: "USD 250k–1M / year" },
                { useCase: "RCI-linked instrument design", fee: "5–10 bps (one-time)" },
                { useCase: "Verification & monitoring", fee: "2–5 bps / year" }
              ]}
              includes={[
                "Forward-looking stability metrics",
                "Scenario stress-testing",
                "Reduced tail-risk uncertainty"
              ]}
              constraints={[
                "No speculative trading access",
                "No exclusive data rights"
              ]}
              footer="Capital pays because it needs stability, not control."
            />

            {/* Philanthropy */}
            <PricingTier
              number="4"
              icon={Heart}
              title="Philanthropy & Endowments"
              clients="Time-horizon anchor (not customers)"
              product="Regenerative Infrastructure Stewardship"
              singleFee="USD 20–100M+, restricted use"
              capitalRestricted={[
                "RCI research and methodology integrity",
                "Governance audits",
                "Community capacity",
                "Crisis backstops"
              ]}
              receives={[
                "Stewardship role (non-voting)",
                "Intergenerational impact assurance",
                "Protection against mission drift"
              ]}
              footer="Philanthropy stabilizes time, not cash flow."
            />
          </div>
        </div>
      </section>

      {/* What Is Never Sold */}
      <section className="py-20 bg-destructive/5">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="destructive" className="mb-4">Critical Boundaries</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What Is <span className="text-destructive">Never Sold</span>
            </h2>
            <p className="text-muted-foreground">
              If any of the following are monetized, the system is invalid.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              "Voting power",
              "Metric manipulation",
              "Faster access for higher pay",
              "Favorable scores",
              "Branding or narrative control"
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass p-4 rounded-xl text-center border border-destructive/20 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-foreground/90">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-Subsidy Logic */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Clean Model</Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Cross-Subsidy Logic
              </h2>
            </div>

            <div className="glass-strong p-8 rounded-2xl border border-border/50">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="glass p-4 rounded-xl">
                  <span className="font-medium text-foreground">Capital Markets & IFIs</span>
                </div>
                <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-primary/30" />
                <div className="glass p-4 rounded-xl">
                  <span className="text-muted-foreground">Subsidize low-income country access</span>
                </div>
                <div className="w-0.5 h-8 bg-gradient-to-b from-primary/30 to-primary" />
                <div className="glass p-4 rounded-xl">
                  <span className="font-medium text-primary">Preserve global legitimacy</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border/50 space-y-2 text-center text-muted-foreground">
                <p>No advertising.</p>
                <p>No sponsorship logos.</p>
                <p>No narrative buyers.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Governance */}
      <section className="py-20 bg-card/30">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">Anti-Capture</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Pricing Governance
            </h2>
            <p className="text-muted-foreground">Pricing itself is governed.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              "Science Council review",
              "Community impact assessment",
              "Public disclosure",
              "Annual Pricing Ethics Audit",
              "Emergency fee waivers during crises"
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass p-4 rounded-xl text-center"
              >
                <span className="text-sm text-foreground/90">{item}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-center mt-8 text-muted-foreground italic">
            All pricing changes require the above.
          </p>
        </div>
      </section>

      {/* 5-Year Sustainability */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">Projection</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              5-Year Sustainability Snapshot
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="glass-strong rounded-2xl overflow-hidden border border-border/50">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="p-4 text-left font-medium text-foreground">Year</th>
                    <th className="p-4 text-left font-medium text-foreground">Active Countries</th>
                    <th className="p-4 text-left font-medium text-foreground">Annual Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { year: "1", countries: "3–5", revenue: "USD 20–40M" },
                    { year: "3", countries: "10–15", revenue: "USD 80–150M" },
                    { year: "5", countries: "25–30", revenue: "USD 250–400M" }
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-border/30 last:border-0">
                      <td className="p-4 text-muted-foreground">{row.year}</td>
                      <td className="p-4 text-foreground">{row.countries}</td>
                      <td className="p-4 text-primary font-medium">{row.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-8 glass p-6 rounded-xl"
            >
              <p className="text-center text-muted-foreground mb-4">Sustains:</p>
              <div className="flex flex-wrap justify-center gap-4">
                {["Global infrastructure", "Independent audits", "R&D", "Crisis response capacity"].map((item, index) => (
                  <span key={index} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-center mt-4 text-foreground font-medium">Without chasing scale.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Doctrine */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-8">
              One-Sentence Pricing Doctrine
            </h2>
            <blockquote className="text-xl md:text-2xl text-foreground/90 italic leading-relaxed">
              "Atlas Sanctum charges those who wield power, so that truth remains free for those who live with the consequences."
            </blockquote>
          </motion.div>
        </div>
      </section>

      {/* Founder's Answer */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Card className="glass-strong border-accent/20">
              <CardHeader className="text-center">
                <Badge className="w-fit mx-auto mb-4 bg-accent/10 text-accent border-accent/20">
                  Use This Verbatim
                </Badge>
                <CardTitle className="text-2xl font-display">Founder's Answer</CardTitle>
                <p className="text-muted-foreground">When asked "How do you make money?":</p>
              </CardHeader>
              <CardContent>
                <blockquote className="text-lg text-center text-foreground/90 italic border-l-4 border-accent pl-6 py-4">
                  "We price risk reduction and accountability.
                  <br />
                  If someone wants influence or shortcuts, we are not for them."
                </blockquote>
                <p className="text-center mt-6 text-muted-foreground">
                  That sentence filters the room.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

// Pricing Tier Component
interface PricingTierProps {
  number: string;
  icon: React.ElementType;
  title: string;
  clients: string;
  product: string;
  tiers?: { tier: string; fee: string }[];
  usageTiers?: { useCase: string; fee: string }[];
  singleFee?: string;
  includes?: string[];
  whyPay?: string[];
  hardRule?: string;
  principle?: string;
  constraints?: string[];
  capitalRestricted?: string[];
  receives?: string[];
  footer?: string;
}

const PricingTier = ({
  number,
  icon: Icon,
  title,
  clients,
  product,
  tiers,
  usageTiers,
  singleFee,
  includes,
  whyPay,
  hardRule,
  principle,
  constraints,
  capitalRestricted,
  receives,
  footer
}: PricingTierProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-strong rounded-2xl p-8 border border-border/50"
    >
      <div className="flex items-start gap-6 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-display font-bold text-xl">{number}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Icon className="w-6 h-6 text-primary" />
            <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">{title}</h3>
          </div>
          <p className="text-muted-foreground"><strong>Clients:</strong> {clients}</p>
          <p className="text-muted-foreground"><strong>Product:</strong> {product}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pricing Table */}
        <div>
          {tiers && (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="p-3 text-left text-foreground">Country Tier</th>
                    <th className="p-3 text-left text-foreground">Annual Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/30 last:border-0">
                      <td className="p-3 text-muted-foreground">{row.tier}</td>
                      <td className="p-3 text-primary font-medium">{row.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {usageTiers && (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="p-3 text-left text-foreground">Use Case</th>
                    <th className="p-3 text-left text-foreground">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {usageTiers.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/30 last:border-0">
                      <td className="p-3 text-muted-foreground">{row.useCase}</td>
                      <td className="p-3 text-primary font-medium">{row.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {singleFee && (
            <div className="glass p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">Pricing Model:</p>
              <p className="text-primary font-medium">{singleFee}</p>
            </div>
          )}

          {capitalRestricted && (
            <div className="glass p-4 rounded-xl">
              <p className="text-sm font-medium text-foreground mb-2">Capital Restricted To:</p>
              <ul className="space-y-1">
                {capitalRestricted.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Includes & Benefits */}
        <div className="space-y-4">
          {includes && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Includes:</p>
              <ul className="space-y-1">
                {includes.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {whyPay && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Why They Pay:</p>
              <ul className="space-y-1">
                {whyPay.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {receives && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">What They Receive:</p>
              <ul className="space-y-1">
                {receives.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {constraints && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Hard Constraints:</p>
              <ul className="space-y-1">
                {constraints.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-destructive/80">
                    <XCircle className="w-3 h-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {(hardRule || principle || footer) && (
        <div className="mt-6 pt-6 border-t border-border/50">
          {hardRule && (
            <p className="text-sm text-accent font-medium">
              <strong>Hard Rule:</strong> {hardRule}
            </p>
          )}
          {principle && (
            <p className="text-sm text-muted-foreground italic">{principle}</p>
          )}
          {footer && (
            <p className="text-sm text-muted-foreground italic">{footer}</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Pricing;
