"use client";

import { useMemo, useRef } from "react";
import { Download } from "lucide-react";
import { exportElementAsPng } from "@/lib/export-image";

export interface SankeyNode {
  id: string;
  label: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  title?: string;
  showExport?: boolean;
}

const PAD = 24;
const NODE_WIDTH = 12;
const GAP = 8;

export function SankeyDiagram({
  nodes,
  links,
  title,
  showExport = true,
}: SankeyDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { width, height, nodeRects, linkPaths } = useMemo(() => {
    if (nodes.length === 0 || links.length === 0) {
      return { width: 400, height: 200, nodeRects: [], linkPaths: [] };
    }

    const totalValue = links.reduce((s, l) => s + l.value, 0);
    if (totalValue <= 0) {
      return { width: 400, height: 200, nodeRects: [], linkPaths: [] };
    }

    const nodeIds = Array.from(new Set(nodes.map((n) => n.id)));
    const sourceIds = Array.from(new Set(links.map((l) => l.source)));
    const targetIds = Array.from(new Set(links.map((l) => l.target)));
    const leftIds = sourceIds.filter((id) => !targetIds.includes(id));
    const rightIds = targetIds.filter((id) => !sourceIds.includes(id));
    const middleIds = sourceIds.filter((id) => targetIds.includes(id));
    const leftCol = leftIds.length ? leftIds : [...middleIds];
    const rightCol = rightIds.length ? rightIds : [...middleIds];

    const valueIn = new Map<string, number>();
    const valueOut = new Map<string, number>();
    links.forEach((l) => {
      valueIn.set(l.target, (valueIn.get(l.target) || 0) + l.value);
      valueOut.set(l.source, (valueOut.get(l.source) || 0) + l.value);
    });

    const colWidth = 120;
    const w = Math.max(400, colWidth * 2 + PAD * 2 + NODE_WIDTH * 2);

    let yLeft = PAD;
    const leftRects: Array<{ id: string; label: string; x: number; y: number; h: number }> = [];
    const leftHeights = new Map<string, number>();
    leftCol.forEach((id) => {
      const v = valueOut.get(id) || valueIn.get(id) || 0;
      const h = Math.max(14, (v / totalValue) * (280 - PAD * 2));
      leftHeights.set(id, h);
      leftRects.push({ id, label: nodes.find((n) => n.id === id)?.label ?? id, x: PAD, y: yLeft, h });
      yLeft += h + GAP;
    });
    let yRight = PAD;
    const rightRects: Array<{ id: string; label: string; x: number; y: number; h: number }> = [];
    rightCol.forEach((id) => {
      const v = valueIn.get(id) || valueOut.get(id) || 0;
      const h = Math.max(14, (v / totalValue) * (280 - PAD * 2));
      rightRects.push({
        id,
        label: nodes.find((n) => n.id === id)?.label ?? id,
        x: w - PAD - NODE_WIDTH,
        y: yRight,
        h,
      });
      yRight += h + GAP;
    });

    const nodeRectsAll = [...leftRects, ...rightRects];
    const getRect = (id: string) => nodeRectsAll.find((r) => r.id === id);
    const linkPaths: Array<{ d: string; value: number }> = [];
    links.forEach((l) => {
      const src = getRect(l.source);
      const tgt = getRect(l.target);
      if (!src || !tgt) return;
      const x0 = src.x + NODE_WIDTH;
      const x1 = tgt.x;
      const y0 = src.y + src.h / 2;
      const y1 = tgt.y + tgt.h / 2;
      const thickness = Math.max(4, (l.value / totalValue) * 200);
      const d = `M ${x0} ${y0} C ${(x0 + x1) / 2} ${y0}, ${(x0 + x1) / 2} ${y1}, ${x1} ${y1}`;
      linkPaths.push({ d, value: l.value });
    });

    const h = Math.max(300, yLeft, yRight) + PAD;

    return {
      width: w,
      height: h,
      nodeRects: nodeRectsAll,
      linkPaths,
    };
  }, [nodes, links]);

  const handleExport = () => {
    if (containerRef.current) {
      exportElementAsPng(containerRef.current, "sankey-diagram");
    }
  };

  if (nodes.length === 0 && links.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center justify-center"
        style={{
          minHeight: 200,
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
        }}
      >
        No flow data
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        {title && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {title}
          </p>
        )}
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
        className="rounded overflow-hidden"
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
          {linkPaths.map((lp, i) => (
            <path
              key={i}
              d={lp.d}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={Math.max(2, Math.min(24, lp.value / 10))}
              strokeOpacity={0.6}
            />
          ))}
          {nodeRects.map((r) => (
            <g key={r.id}>
              <rect
                x={r.x}
                y={r.y}
                width={NODE_WIDTH}
                height={r.h}
                rx={2}
                fill="var(--accent)"
                opacity={0.9}
              />
              <text
                x={r.x + NODE_WIDTH + 6}
                y={r.y + r.h / 2}
                dy="0.35em"
                fill="var(--text-primary)"
                fontSize={11}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {r.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
