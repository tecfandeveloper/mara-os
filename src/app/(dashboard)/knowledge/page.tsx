"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Network } from "lucide-react";
import { KnowledgeGraphView } from "@/components/KnowledgeGraphView";

interface Workspace {
  id: string;
  name: string;
  emoji: string;
  path: string;
}

interface GraphData {
  nodes: Array<{ id: string; label: string; type: string; file: string; snippet: string; section?: string }>;
  edges: Array<{ sourceId: string; targetId: string; weight: number }>;
}

export default function KnowledgePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("workspace");
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    if (!selectedWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const w = encodeURIComponent(selectedWorkspace);
      const res = await fetch(`/api/memory/graph?workspace=${w}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load graph");
      setData({ nodes: json.nodes || [], edges: json.edges || [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    fetch("/api/files/workspaces")
      .then((r) => r.json())
      .then((d) => {
        const list = d.workspaces || [];
        setWorkspaces(list);
        if (list.length > 0 && selectedWorkspace === "workspace") {
          setSelectedWorkspace(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <div className="p-4 md:p-8" style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>
      <div className="mb-4 md:mb-6 flex items-center gap-4">
        <Link
          href="/memory"
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
          Memory
        </Link>
      </div>
      <div className="mb-4 md:mb-6">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          <Network size={28} style={{ color: "var(--accent)" }} />
          Knowledge Graph
        </h1>
        <p className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
          Conceptos y entidades en MEMORY. Clic en un nodo para ver contexto.
        </p>
      </div>

      {workspaces.length > 1 && (
        <div
          className="rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Workspace
          </span>
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.emoji} {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div
          className="rounded-xl flex items-center justify-center py-16"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--accent)" }}
          />
        </div>
      )}
      {error && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}
      {!loading && !error && data && (
        <KnowledgeGraphView
          nodes={data.nodes}
          edges={data.edges}
          workspace={selectedWorkspace}
          showExport
        />
      )}
    </div>
  );
}
