"use client";

import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { usePathname } from "next/navigation";

export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <AnimatePresence mode="wait" initial={isHome ? true : false}>
      <motion.div
        key={pathname}
        initial={{ opacity: isHome ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: isHome ? 1 : 0 }}
        transition={{ duration: isHome ? 0 : 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

