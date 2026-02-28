"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SankeyDiagram } from "@/components/charts/SankeyDiagram";
import { ArrowLeft, GitBranch } from "lucide-react";

type FlowType = "tokens" | "tasks" | "time";

interface SankeyData {
  nodes: { id: string; label: string }[];
  links: { source: string; target: string; value: number }[];
}

const FLOW_LABELS: Record<FlowType, string> = {
  tokens: "Token flow (input / output)",
  tasks: "Activity type → status",
  time: "Time of day → activity type",
};

export default function SankeyPage() {
  const [flow, setFlow] = useState<FlowType>("tasks");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSankey = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ flow, days: String(days) });
      const res = await fetch(`/api/analytics/sankey?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData({ nodes: json.nodes || [], links: json.links || [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [flow, days]);

  useEffect(() => {
    fetchSankey();
  }, [fetchSankey]);

  return (
    <div className="p-4 md:p-8" style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>
      <div className="mb-4 md:mb-6 flex items-center gap-4">
        <Link
          href="/analytics"
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
          Analytics
        </Link>
      </div>
      <div className="mb-4 md:mb-6">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          Sankey diagrams
        </h1>
        <p className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
          Flujos de tokens, tareas y tiempo
        </p>
      </div>

      <div
        className="rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <GitBranch size={18} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Flow
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["tokens", "tasks", "time"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFlow(f)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: flow === f ? "var(--accent)" : "var(--card-elevated)",
                color: flow === f ? "var(--bg, #111)" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {FLOW_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Days</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg px-2 py-1.5 text-sm"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
            <option value={90}>90</option>
          </select>
        </div>
      </div>

      {loading && (
        <div
          className="rounded-xl flex items-center justify-center py-16"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)" }} />
        </div>
      )}
      {error && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--error)" }}
        >
          {error}
        </div>
      )}
      {!loading && !error && data && (
        <div
          className="rounded-xl p-4 md:p-6"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <SankeyDiagram
            nodes={data.nodes}
            links={data.links}
            title={FLOW_LABELS[flow]}
            showExport
          />
        </div>
      )}
    </div>
  );
}
