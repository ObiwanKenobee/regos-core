import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface ScrollAnimationWrapperProps {
  children: ReactNode;
  variant?: "fadeUp" | "fadeIn" | "slideLeft" | "slideRight" | "scaleUp" | "stagger";
  delay?: number;
  duration?: number;
  className?: string;
}

const variants: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -80 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 80 },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  stagger: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
};

export const ScrollAnimationWrapper = ({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.6,
  className = "",
}: ScrollAnimationWrapperProps) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants[variant]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ParallaxWrapperProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxWrapper = ({
  children,
  speed = 0.3,
  className = "",
}: ParallaxWrapperProps) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      whileInView={{ y: 0 }}
      viewport={{ once: false }}
      style={{
        willChange: "transform",
      }}
      className={className}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 30,
      }}
    >
      <motion.div
        style={{
          y: 0,
        }}
        whileInView={{
          y: [0, -30 * speed, 0],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
        }}
        viewport={{ once: false, amount: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default ScrollAnimationWrapper;
