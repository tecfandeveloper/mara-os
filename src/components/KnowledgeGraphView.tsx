"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Download, ExternalLink, X } from "lucide-react";
import { exportElementAsPng } from "@/lib/export-image";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  file: string;
  snippet: string;
  section?: string;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  weight: number;
}

interface KnowledgeGraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  workspace: string;
  showExport?: boolean;
}

function circularLayout(nodes: GraphNode[], width: number, height: number): Map<string, { x: number; y: number }> {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.38;
  const map = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, nodes.length);
    map.set(n.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  });
  return map;
}

export function KnowledgeGraphView({
  nodes,
  edges,
  workspace,
  showExport = true,
}: KnowledgeGraphViewProps) {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodes;
    const lower = search.toLowerCase();
    return nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(lower) ||
        n.snippet.toLowerCase().includes(lower) ||
        n.file.toLowerCase().includes(lower)
    );
  }, [nodes, search]);

  const width = 700;
  const height = 500;
  const positions = useMemo(
    () => circularLayout(filteredNodes, width, height),
    [filteredNodes]
  );

  const handleExport = useCallback(() => {
    if (containerRef.current) {
      exportElementAsPng(containerRef.current, "knowledge-graph");
    }
  }, []);

  if (nodes.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center justify-center py-16"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
        }}
      >
        No nodes. Add headings or terms in MEMORY.md.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <input
          type="text"
          placeholder="Filter nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] rounded-lg px-3 py-1.5 text-sm"
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
        {showExport && (
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
            style={{
              color: "var(--accent)",
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
            }}
          >
            <Download size={12} />
            Export image
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden relative"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}
        >
          {edges
            .filter((e) => positions.has(e.sourceId) && positions.has(e.targetId))
            .map((e, i) => {
              const src = positions.get(e.sourceId)!;
              const tgt = positions.get(e.targetId)!;
              return (
                <line
                  key={i}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke="var(--border)"
                  strokeWidth={Math.min(3, 1 + e.weight * 0.5)}
                  strokeOpacity={0.6}
                />
              );
            })}
          {filteredNodes.map((n) => {
            const pos = positions.get(n.id);
            if (!pos) return null;
            const isSelected = selected?.id === n.id;
            return (
              <g
                key={n.id}
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(n)}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 14 : 10}
                  fill={isSelected ? "var(--accent)" : "var(--card-elevated)"}
                  stroke="var(--accent)"
                  strokeWidth={isSelected ? 3 : 1}
                  strokeOpacity={0.8}
                />
                <text
                  x={pos.x}
                  y={pos.y - 16}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize={10}
                  style={{ fontFamily: "var(--font-body)", pointerEvents: "none" }}
                >
                  {n.label.length > 18 ? n.label.slice(0, 17) + "…" : n.label}
                </text>
              </g>
            );
          })}
        </svg>
        {selected && (
          <div
            className="absolute right-2 top-2 bottom-2 w-72 rounded-lg p-3 overflow-y-auto flex flex-col gap-2"
            style={{
              backgroundColor: "var(--card-elevated)",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {selected.label}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1 rounded"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {selected.file}
            </p>
            <p className="text-xs flex-1" style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
              {selected.snippet}
            </p>
            <Link
              href={`/memory?workspace=${encodeURIComponent(workspace)}`}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              <ExternalLink size={12} />
              Open in Memory
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
