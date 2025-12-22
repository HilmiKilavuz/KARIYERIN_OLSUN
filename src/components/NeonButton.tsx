"use client";
import React from "react";
import { motion, useMotionValue, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

export type NeonButtonProps = HTMLMotionProps<"button"> & {
  ariaLabel?: string;
  persistentGlow?: boolean; // Ana sayfada sürekli ışık efekti için
};

export const NeonButton: React.FC<NeonButtonProps> = ({ children, className, onMouseMove, ariaLabel, persistentGlow = false, ...props }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
    onMouseMove?.(e);
  };

  return (
    <motion.button
      aria-label={ariaLabel ?? (typeof children === "string" ? (children as string) : undefined)}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-primary/50 px-6 py-2 text-lg font-semibold tracking-wider text-accent/90 transition-colors hover:border-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
        persistentGlow && "shadow-[0_0_20px_6px_rgba(0,240,255,0.35)] animate-glow",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {/* Ripple / glow layer */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -z-10 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/40 blur-2xl will-change-transform sm:h-28 sm:w-28"
        style={{ left: x, top: y }}
        initial={persistentGlow ? { scale: 2.2, opacity: 0.5 } : { scale: 0, opacity: 0 }}
        animate={persistentGlow ? { scale: 2.4, opacity: 0.6 } : undefined}
        whileHover={{ scale: 3, opacity: 0.6 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Content */}
      <motion.span
        className="relative z-10"
        transition={{ duration: 0.2 }}
        whileHover={{ y: -2, color: "#FFFFFF" }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

