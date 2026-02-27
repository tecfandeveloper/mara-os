"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { AgentGraph } from "@/components/AgentGraph";
import { Network, Filter, ExternalLink, X } from "lucide-react";

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

export default function AgentGraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => format(startOfDay(subDays(new Date(), 7)), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(endOfDay(new Date()), "yyyy-MM-dd"));

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch(`/api/subagents/graph?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load graph");
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load graph");
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="p-4 md:p-8" style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>
      <div className="mb-4 md:mb-6">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          Agent Communication Graph
        </h1>
        <p className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
          Flujo entre main agent y sub-agents (tokens). Clic en un nodo para ver detalles.
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Rango de fechas</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm border"
            style={{ backgroundColor: "var(--card-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
          <span style={{ color: "var(--text-muted)" }}>–</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm border"
            style={{ backgroundColor: "var(--card-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {loading ? (
            <div
              className="rounded-xl flex items-center justify-center"
              style={{ minHeight: 280, backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : error ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p style={{ color: "var(--error)" }}>{error}</p>
            </div>
          ) : (
            <AgentGraph
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          )}
        </div>

        {/* Side panel when node selected */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            minHeight: 200,
          }}
        >
          {selectedNode ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {selectedNode.type === "main" ? "🦞 Main" : `🤖 ${selectedNode.label}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                Total tokens: {selectedNode.totalTokens.toLocaleString()}
              </p>
              <Link
                href="/sessions"
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: "var(--accent)" }}
              >
                <ExternalLink className="w-4 h-4" />
                Ver sesiones en Session History
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Network className="w-10 h-10 mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Haz clic en un nodo para ver detalles y enlace al transcript.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
