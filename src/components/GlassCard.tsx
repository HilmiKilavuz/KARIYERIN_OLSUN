"use client";

import React, { useRef, useState } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

type GlassCardProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode;
};

export const GlassCard: React.FC<GlassCardProps> = ({
  className,
  children,
  onMouseMove,
  onMouseLeave,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const MAX_TILT = 8; // derece

  const handleMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rotateY = (px - 0.5) * (MAX_TILT * 2);
    const rotateX = (0.5 - py) * (MAX_TILT * 2);
    setTilt({ x: rotateX, y: rotateY });
    onMouseMove?.(e);
  };

  const handleLeave: React.MouseEventHandler<HTMLDivElement> = (e) => {
    setTilt({ x: 0, y: 0 });
    onMouseLeave?.(e);
  };

  const shineVariants = {
    rest: { x: "-120%", opacity: 0 },
    hover: { x: "120%", opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
  } as const;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial="rest"
      whileHover="hover"
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 200, damping: 20, mass: 0.5 }}
      style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
      className={cn(
        // Glass look
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg backdrop-blur-xl",
        // Smooth motion
        "transition-[transform,box-shadow] duration-300 will-change-transform",
        // Subtle glow on hover
        "hover:shadow-[0_10px_40px_rgba(157,0,255,0.15)]",
        className
      )}
      {...props}
    >
      {/* Shine sweep */}
      <motion.span
        aria-hidden
        variants={shineVariants}
        className="pointer-events-none absolute inset-y-0 -left-[60%] z-0 w-[120%] -rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

