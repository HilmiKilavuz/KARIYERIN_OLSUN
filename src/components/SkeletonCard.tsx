"use client";

import React from "react";
import { cn } from "@/lib/cn";

export default function SkeletonCard({ className, lines = 4 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl", className)}>
      <div className="absolute inset-0 -translate-x-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shine_1.8s_linear_infinite]" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn("h-4 w-full rounded bg-white/10", i === 0 && "h-6 w-2/3")} />
        ))}
      </div>
      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-33%); }
          100% { transform: translateX(133%); }
        }
      `}</style>
    </div>
  );
}

