"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { CheckCircle2, Circle, ArrowRight, Star, Zap } from "lucide-react";

type RoadmapNode = {
  id: string;
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  priority: "critical" | "high" | "medium";
  connections?: string[]; // IDs of connected nodes
};

export default function DevelopmentSuggestions({ className, reportText }: { className?: string, reportText?: string }) {

  // Dynamic parsing logic
  const getSuggestions = (): RoadmapNode[] => {
    if (!reportText) return [];

    let relevantText = reportText;

    const headerRegex = /GELİŞTİRİLMESİ GEREKEN ALANLAR[:\s]*/i;
    const match = reportText.match(headerRegex);

    if (match && match.index !== undefined) {
      const startIndex = match.index + match[0].length;
      const remaining = reportText.slice(startIndex);
      const nextSectionMatch = remaining.search(/\n[A-ZÖÇŞİĞÜ ]{5,}:/);
      relevantText = nextSectionMatch !== -1 ? remaining.slice(0, nextSectionMatch) : remaining;
    }

    const lines = relevantText.split('\n').map(l => l.trim()).filter(l => l.length > 5);

    const suggestedItems = lines
      .filter(l =>
        l.startsWith('-') ||
        l.startsWith('*') ||
        /^\d+\./.test(l)
      )
      .slice(0, 6);

    return suggestedItems.map((item, index) => {
      const cleaned = item.replace(/^[-*]|\d+\.\s*/, '').trim();

      let priority: "critical" | "high" | "medium" = "medium";
      if (index < 2) priority = "critical";
      else if (index < 4) priority = "high";

      return {
        id: `node-${index}`,
        title: cleaned.length > 40 ? cleaned.substring(0, 40) + '...' : cleaned,
        description: cleaned,
        status: "locked",
        priority,
        connections: index < suggestedItems.length - 1 ? [`node-${index + 1}`] : undefined
      };
    });
  };

  const nodes = getSuggestions();

  const getPriorityStyles = (priority: "critical" | "high" | "medium", status: string) => {
    const base = status === "completed"
      ? "bg-green-500/20 border-green-500 text-green-400"
      : status === "current"
        ? "bg-accent/20 border-accent text-accent animate-pulse"
        : "";

    if (status === "locked") {
      switch (priority) {
        case "critical":
          return "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/40 text-red-300 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]";
        case "high":
          return "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]";
        default:
          return "bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/40 text-blue-300 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]";
      }
    }

    return base;
  };

  const getIcon = (status: string) => {
    if (status === "completed") return CheckCircle2;
    if (status === "current") return Circle;
    return Circle;
  };

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-accent/50" />
        </div>
        <p className="text-gray-400 text-sm">Kariyer haritanız hazırlanıyor...</p>
      </div>
    );
  }

  // Create a visual grid layout (2 columns)
  const leftNodes = nodes.filter((_, i) => i % 2 === 0);
  const rightNodes = nodes.filter((_, i) => i % 2 === 1);

  return (
    <div className={cn("relative", className)}>
      {/* Header with gradient */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Kariyer Gelişim Haritası</h3>
        </div>
        <p className="text-xs text-gray-400 pl-11">Kritik eksiklerini kapatarak rotanda ilerle</p>
      </div>

      {/* Roadmap Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Left Column */}
        <div className="space-y-4">
          {leftNodes.map((node, index) => {
            const Icon = getIcon(node.status);
            const styles = getPriorityStyles(node.priority, node.status);

            return (
              <div key={node.id} className="relative">
                {/* Node Card */}
                <div className={cn(
                  "group relative rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer",
                  styles
                )}>
                  {/* Priority Badge */}
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                    {index * 2 + 1}
                  </div>

                  {/* Content */}
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                        {node.title}
                      </h4>
                      <p className="text-xs opacity-80 line-clamp-2">
                        {node.description}
                      </p>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Connection Arrow to right if there's a corresponding right node */}
                {index < rightNodes.length && (
                  <div className="absolute top-1/2 -right-[18px] z-10">
                    <ArrowRight className="w-4 h-4 text-accent/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {rightNodes.map((node, index) => {
            const Icon = getIcon(node.status);
            const styles = getPriorityStyles(node.priority, node.status);

            return (
              <div key={node.id} className="relative">
                {/* Node Card */}
                <div className={cn(
                  "group relative rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer",
                  styles
                )}>
                  {/* Priority Badge */}
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                    {index * 2 + 2}
                  </div>

                  {/* Content */}
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                        {node.title}
                      </h4>
                      <p className="text-xs opacity-80 line-clamp-2">
                        {node.description}
                      </p>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Connection Arrow down if there's next left node */}
                {index < leftNodes.length - 1 && (
                  <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 z-10 rotate-90">
                    <ArrowRight className="w-4 h-4 text-accent/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-400 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border-2 border-red-500/40 bg-red-500/10" />
          <span>Kritik</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border-2 border-amber-500/40 bg-amber-500/10" />
          <span>Yüksek</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border-2 border-blue-500/40 bg-blue-500/10" />
          <span>Orta</span>
        </div>
      </div>

      {/* Interactive hint */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          <span className="text-accent">💡 İpucu:</span> Kutuların üzerine gelerek detayları görebilirsiniz
        </p>
      </div>
    </div>
  );
}
