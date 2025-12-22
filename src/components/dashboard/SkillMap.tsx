"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ForceGraphMethods } from "react-force-graph-2d";

// Dynamically import to avoid SSR "window is not defined"
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GraphNode = { id: string; name?: string; level?: number; x?: number; y?: number };
type GraphLink = { source: string | GraphNode; target: string | GraphNode };

// Mock data
export const mockData: { nodes: GraphNode[]; links: GraphLink[] } = {
  nodes: [
    { id: "React", name: "React.js", level: 5 },
    { id: "Next.js", name: "Next.js", level: 4 },
    { id: "TypeScript", name: "TypeScript", level: 4 },
    { id: "Node.js", name: "Node.js", level: 3 },
    { id: "UI/UX", name: "UI/UX Design", level: 5 },
  ],
  links: [
    { source: "React", target: "Next.js" },
    { source: "React", target: "TypeScript" },
    { source: "Node.js", target: "TypeScript" },
    { source: "React", target: "UI/UX" },
  ],
};

export type SkillMapProps = {
  data?: { nodes: GraphNode[]; links: GraphLink[] };
  height?: number;
};

function useMeasure() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ width: cr.width, height: cr.height });
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, size } as const;
}

export default function SkillMap({ data = mockData, height = 360 }: SkillMapProps) {
  const { ref, size } = useMeasure();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

  // Build adjacency for hover highlighting
  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    data.nodes.forEach((n: GraphNode) => map.set(n.id, new Set<string>()));
    data.links.forEach((l: GraphLink) => {
      const s = typeof l.source === "string" ? l.source : (l.source as GraphNode).id;
      const t = typeof l.target === "string" ? l.target : (l.target as GraphNode).id;
      map.get(s)?.add(t);
      map.get(t)?.add(s);
    });
    return map;
  }, [data]);

  const [hoverId, setHoverId] = useState<string | null>(null);
  const neighbors = useMemo(() => {
    if (!hoverId) return new Set<string>();
    const adj = adjacency.get(hoverId);
    return new Set([hoverId, ...([...(adj ?? [])] as string[])]);
  }, [hoverId, adjacency]);

  // Physics tuning via imperative API (safe-cast without 'any')
  React.useEffect(() => {
    const charge = fgRef.current?.d3Force?.("charge") as { strength?: (v: number) => void } | undefined;
    charge?.strength?.(-220);
    const link = fgRef.current?.d3Force?.("link") as { distance?: (d: number) => void } | undefined;
    link?.distance?.(140);
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height: height ? height : size.height || 360 }}>
      <ForceGraph2D
        ref={fgRef as React.MutableRefObject<ForceGraphMethods | undefined>}
        width={size.width || undefined}
        height={height || size.height || 360}
        graphData={data as unknown as { nodes: { [k: string]: unknown }[]; links: { [k: string]: unknown }[] }}
        backgroundColor="rgba(0,0,0,0)"
        cooldownTicks={80}
        linkColor={(l: unknown) => {
          const link = l as GraphLink;
          const sid = typeof link.source === "object" ? (link.source as GraphNode).id : (link.source as string);
          const tid = typeof link.target === "object" ? (link.target as GraphNode).id : (link.target as string);
          const active = hoverId && neighbors.has(sid) && neighbors.has(tid);
          return active ? "rgba(0, 240, 255, 0.7)" : "rgba(0, 240, 255, 0.25)";
        }}
        linkWidth={(l: unknown) => {
          const link = l as GraphLink;
          const sid = typeof link.source === "object" ? (link.source as GraphNode).id : (link.source as string);
          const tid = typeof link.target === "object" ? (link.target as GraphNode).id : (link.target as string);
          const active = hoverId && neighbors.has(sid) && neighbors.has(tid);
          return active ? 2 : 1;
        }}
        onNodeHover={(node: unknown) => setHoverId((node as GraphNode | null)?.id ?? null)}
        nodeCanvasObject={(node: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const n = node as GraphNode & { x: number; y: number };
          const r = 2 + (n.level ?? 3) * 2;
          const active = hoverId ? neighbors.has(n.id as string) : true;
          ctx.save();
          // glow
          ctx.shadowBlur = active ? 20 : 8;
          ctx.shadowColor = active ? "rgba(157,0,255,0.8)" : "rgba(0,240,255,0.5)";
          ctx.beginPath();
          ctx.arc(n.x as number, n.y as number, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = active ? "#9D00FF" : "#00F0FF";
          ctx.fill();

          // label
          const label = (n.name as string) || (n.id as string);
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sora, Inter, sans-serif`;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.shadowBlur = 0;
          ctx.fillText(label, n.x as number, (n.y as number) + r + 2);
          ctx.restore();
        }}
      />
    </div>
  );
}
