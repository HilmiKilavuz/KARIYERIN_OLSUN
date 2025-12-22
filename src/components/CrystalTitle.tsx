"use client";

import React, { useMemo, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";

type CrystalTitleProps = {
  text?: string;
  className?: string;
};

// Deterministic pseudo-random for stable offsets per letter
function seeded(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.1,
    },
  },
};

const wordVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.01,
    },
  },
};

const letterVariants: Variants = {
  initial: (i: number) => {
    const rx = (seeded(i + 1) - 0.5) * 120; // -60..60px
    const ry = (seeded(i + 2) - 0.5) * 120; // -60..60px
    const s = 0.5 + seeded(i + 3) * 0.2; // ~0.5-0.7
    return {
      x: rx,
      y: ry,
      scale: s,
      opacity: 0,
      filter: "blur(8px)",
    };
  },
  animate: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 14,
      mass: 0.4,
    },
  },
};

export function CrystalTitle({
  text = "Kariyer Potansiyelini Kristalize Et",
  className,
}: CrystalTitleProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const words = useMemo(() => text.split(" "), [text]);

  // flat index for deterministic variant custom values
  const indices = useMemo(() => {
    let k = 0;
    return words.map((w) =>
      w.split("").map(() => {
        k += 1;
        return k;
      })
    );
  }, [words]);

  // SSR-safe: render static text until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <h1 className={cn("text-4xl font-extrabold tracking-tight text-accent sm:text-5xl md:text-6xl", className)}>
        {text}
      </h1>
    );
  }

  return (
    <motion.h1
      key="crystal"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "text-4xl font-extrabold tracking-tight text-accent sm:text-5xl md:text-6xl",
        className
      )}
    >
      {words.map((word, wi) => (
        <motion.span
          key={`w-${wi}`}
          variants={wordVariants}
          className="mr-2 inline-block last:mr-0"
        >
          {word.split("").map((char, ci) => (
            <motion.span
              key={`c-${wi}-${ci}`}
              className="inline-block"
              variants={letterVariants}
              custom={indices[wi][ci]}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      ))}
    </motion.h1>
  );
}

