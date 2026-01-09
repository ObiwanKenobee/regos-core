import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="py-16 bg-background border-t border-border/50">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-8">
            <h3 className="text-2xl font-display font-bold">
              <span className="text-gradient-primary">Atlas</span>{" "}
              <span className="text-foreground">Sanctum</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Regenerative Operating System v2.0
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm">
            {["Architecture", "RCI Methodology", "Governance", "Research", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="pt-8 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              A civilizational survival technology. Built for long-term resilience.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              © 2025 Atlas Sanctum. Stewarding regenerative capacity for future generations.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
