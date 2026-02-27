"use client";

import { useMemo } from "react";
import Link from "next/link";

interface GraphNode {
  id: string;
  label: string;
  type: "main" | "subagent";
  totalTokens: number;
}

interface GraphEdge {
  source: string;
  target: string;
  tokens: number;
}

interface AgentGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

const MAIN_X = 120;
const SUBAGENT_X = 380;
const NODE_R = 36;

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

export function AgentGraph({ nodes, edges, selectedNodeId, onSelectNode }: AgentGraphProps) {
  const mainNode = nodes.find((n) => n.type === "main");
  const subNodes = nodes.filter((n) => n.type === "subagent");

  const subagentPositions = useMemo(() => {
    const positions: { id: string; y: number }[] = [];
    const spacing = 80;
    const startY = 60 + (subNodes.length - 1) * (spacing / 2);
    subNodes.forEach((n, i) => {
      positions.push({ id: n.id, y: startY - i * spacing });
    });
    return positions;
  }, [subNodes]);

  const mainY = 160;

  if (nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          minHeight: 280,
          backgroundColor: "var(--card-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <p style={{ color: "var(--text-muted)" }}>No nodes to display</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}>
      <svg
        viewBox="0 0 480 320"
        className="w-full"
        style={{ minHeight: 280 }}
      >
        {/* Edges */}
        {edges.map((e) => {
          const targetPos = subagentPositions.find((p) => p.id === e.target);
          if (!targetPos) return null;
          const x1 = MAIN_X + NODE_R;
          const y1 = mainY;
          const x2 = SUBAGENT_X - NODE_R;
          const y2 = targetPos.y;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          return (
            <g key={`${e.source}-${e.target}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--border)"
                strokeWidth={2}
                strokeDasharray="4 2"
              />
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {formatTokens(e.tokens)}
              </text>
            </g>
          );
        })}

        {/* Main node */}
        {mainNode && (
          <g
            onClick={() => onSelectNode(selectedNodeId === mainNode.id ? null : mainNode.id)}
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={MAIN_X}
              cy={mainY}
              r={NODE_R}
              fill={selectedNodeId === mainNode.id ? "var(--accent)" : "var(--accent-soft)"}
              stroke="var(--accent)"
              strokeWidth={selectedNodeId === mainNode.id ? 3 : 1}
            />
            <text x={MAIN_X} y={mainY - 4} textAnchor="middle" fontSize="20">
              🦞
            </text>
            <text x={MAIN_X} y={mainY + 14} textAnchor="middle" fontSize="11" fill="var(--text-primary)">
              Main
            </text>
            <text x={MAIN_X} y={mainY + 28} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
              {formatTokens(mainNode.totalTokens)}
            </text>
          </g>
        )}

        {/* Subagent nodes */}
        {subagentPositions.map((pos) => {
          const node = subNodes.find((n) => n.id === pos.id);
          if (!node) return null;
          const selected = selectedNodeId === node.id;
          return (
            <g
              key={node.id}
              onClick={() => onSelectNode(selected ? null : node.id)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={SUBAGENT_X}
                cy={pos.y}
                r={NODE_R}
                fill={selected ? "var(--info)" : "var(--card)"}
                stroke="var(--info)"
                strokeWidth={selected ? 3 : 1}
              />
              <text x={SUBAGENT_X} y={pos.y - 4} textAnchor="middle" fontSize="18">
                🤖
              </text>
              <text x={SUBAGENT_X} y={pos.y + 14} textAnchor="middle" fontSize="10" fill="var(--text-primary)">
                {node.label.length > 10 ? node.label.slice(0, 8) + "…" : node.label}
              </text>
              <text x={SUBAGENT_X} y={pos.y + 26} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                {formatTokens(node.totalTokens)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
