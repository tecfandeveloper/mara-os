"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { KanbanSquare, RefreshCw, ExternalLink } from "lucide-react";

type Card = {
  text: string;
  checked: boolean;
};

type Board = {
  backlog: Card[];
  todo: Card[];
  doing: Card[];
  done: Card[];
};

const COLUMN_META: Array<{ key: keyof Board; label: string; color: string }> = [
  { key: "backlog", label: "Backlog", color: "#64748b" },
  { key: "todo", label: "Todo", color: "#f59e0b" },
  { key: "doing", label: "Doing", color: "#3b82f6" },
  { key: "done", label: "Done", color: "#22c55e" },
];

export default function KanbanPage() {
  const [board, setBoard] = useState<Board>({ backlog: [], todo: [], doing: [], done: [] });
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kanban", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load kanban");
      setBoard(data.columns || { backlog: [], todo: [], doing: [], done: [] });
      setSource(data.source || "");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load kanban");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", letterSpacing: "-1.5px" }}>
            <KanbanSquare className="inline-block w-8 h-8 mr-2 mb-1" />
            Kanban
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Kanban en tiempo real desde Obsidian
          </p>
          {source && (
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Fuente: {source}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/memory"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            <ExternalLink className="w-4 h-4" />
            Memory
          </Link>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMN_META.map((column) => {
          const items = board[column.key] || [];
          return (
            <div key={column.key} className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: `${column.color}15` }}>
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{column.label}</div>
                <div className="text-xs px-2 py-1 rounded-full" style={{ background: `${column.color}22`, color: column.color, border: `1px solid ${column.color}44` }}>
                  {items.length}
                </div>
              </div>

              <div className="p-3 space-y-3 min-h-[240px]">
                {items.length === 0 ? (
                  <div className="text-sm italic" style={{ color: "var(--text-muted)" }}>Sin tareas</div>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={`${column.key}-${idx}-${item.text}`}
                      className="rounded-lg p-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        opacity: item.checked ? 0.72 : 1,
                      }}
                    >
                      <div className="text-sm leading-6" style={{ textDecoration: item.checked ? "line-through" : "none" }}>
                        {item.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
