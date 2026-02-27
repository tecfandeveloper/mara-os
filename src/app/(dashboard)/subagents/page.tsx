"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bot,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Cpu,
  Coins,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

type SubagentState = "running" | "completed" | "failed";

interface SubagentSession {
  id: string;
  key: string;
  subagentId: string;
  sessionId: string | null;
  updatedAt: number;
  ageMs: number;
  model: string;
  modelProvider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  contextUsedPercent: number | null;
  aborted: boolean;
  state: SubagentState;
  name?: string;
  emoji?: string;
  color?: string;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function shortModel(model: string): string {
  const m = model.replace("anthropic/", "").replace("claude-", "");
  const parts = m.split("-");
  if (parts.length >= 2) {
    const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const ver = parts.slice(1).join(".");
    return `${name} ${ver}`;
  }
  return model;
}

const stateConfig: Record<
  SubagentState,
  { label: string; icon: React.ComponentType<{ className?: string; size?: number }>; colorVar: string }
> = {
  running: { label: "Running", icon: Loader2, colorVar: "var(--info)" },
  completed: { label: "Completed", icon: CheckCircle, colorVar: "var(--success)" },
  failed: { label: "Failed", icon: XCircle, colorVar: "var(--error)" },
};

const POLL_INTERVAL_MS = 20_000;

export default function SubagentsPage() {
  const [subagents, setSubagents] = useState<SubagentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubagents = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/subagents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setSubagents(data.subagents || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subagents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubagents();
  }, [loadSubagents]);

  useEffect(() => {
    const t = setInterval(loadSubagents, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [loadSubagents]);

  const totalTokens = subagents.reduce((s, a) => s + a.totalTokens, 0);
  const runningCount = subagents.filter((a) => a.state === "running").length;

  return (
    <div className="p-4 md:p-8" style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>
      <div className="mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
          >
            Sub-Agent Dashboard
          </h1>
          <p className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
            Sub-agents activos en tiempo real: estado, modelo, tokens y timeline de spawns/completions
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); loadSubagents(); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading && subagents.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
          />
        </div>
      ) : error ? (
        <div
          className="rounded-xl p-6 text-center"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <XCircle className="w-12 h-12 mx-auto mb-2" style={{ color: "var(--error)" }} />
          <p style={{ color: "var(--text-secondary)" }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div
              className="rounded-xl p-3 md:p-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs md:text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Total sessions</p>
              <p className="text-xl md:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {subagents.length}
              </p>
            </div>
            <div
              className="rounded-xl p-3 md:p-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs md:text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Running</p>
              <p className="text-xl md:text-2xl font-bold" style={{ color: "var(--info)" }}>
                {runningCount}
              </p>
            </div>
            <div
              className="rounded-xl p-3 md:p-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs md:text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Total tokens</p>
              <p className="text-xl md:text-2xl font-bold" style={{ color: "var(--accent)" }}>
                {formatTokens(totalTokens)}
              </p>
            </div>
            <div
              className="rounded-xl p-3 md:p-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs md:text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Unique subagents</p>
              <p className="text-xl md:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {new Set(subagents.map((a) => a.subagentId)).size}
              </p>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-6">
            <h2
              className="text-lg font-bold mb-3"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              Active sub-agent sessions
            </h2>
            {subagents.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <Bot className="w-12 h-12 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                <p style={{ color: "var(--text-secondary)" }}>No sub-agent sessions right now.</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  When the main agent spawns sub-agents, they will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {subagents.map((s) => {
                  const cfg = stateConfig[s.state];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl p-4 flex flex-col"
                      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0">{s.emoji || "🤖"}</span>
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: s.color || "var(--text-primary)" }}>
                              {s.name || s.subagentId}
                            </p>
                            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                              {s.subagentId}
                            </p>
                          </div>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                          style={{ backgroundColor: `${cfg.colorVar}20`, color: cfg.colorVar }}
                        >
                          {s.state === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
                          <Icon size={12} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm mb-3">
                        <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                          <Cpu className="w-3.5 h-3.5" />
                          {shortModel(s.model)}
                        </span>
                        <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                          <Coins className="w-3.5 h-3.5" />
                          {formatTokens(s.totalTokens)} tokens
                        </span>
                        {s.contextUsedPercent != null && (
                          <span style={{ color: "var(--text-muted)" }}>
                            <Activity className="w-3.5 h-3.5 inline mr-0.5" />
                            {s.contextUsedPercent}% ctx
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                        </span>
                        {s.sessionId && (
                          <Link
                            href={`/sessions?sessionId=${encodeURIComponent(s.sessionId)}`}
                            className="inline-flex items-center gap-1 text-xs font-medium"
                            style={{ color: "var(--accent)" }}
                          >
                            Ver transcript
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline */}
          {subagents.length > 0 && (
            <div>
              <h2
                className="text-lg font-bold mb-3"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
              >
                Timeline (spawns / completions)
              </h2>
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {subagents.map((s) => {
                    const cfg = stateConfig[s.state];
                    return (
                      <li key={s.id} className="flex items-center gap-4 px-4 py-3">
                        <Clock className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {s.emoji || "🤖"} {s.name || s.subagentId}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {format(new Date(s.updatedAt), "dd MMM yyyy HH:mm:ss")} · {formatTokens(s.totalTokens)} tokens
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                          style={{ backgroundColor: `${cfg.colorVar}20`, color: cfg.colorVar }}
                        >
                          {cfg.label}
                        </span>
                        {s.sessionId && (
                          <Link
                            href={`/sessions?sessionId=${encodeURIComponent(s.sessionId)}`}
                            className="text-xs font-medium shrink-0"
                            style={{ color: "var(--accent)" }}
                          >
                            Ver transcript
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
