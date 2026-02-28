"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { ActivityFeed, Activity as ActivityItem } from "@/components/ActivityFeed";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Notepad } from "@/components/Notepad";
import { MoodDashboard } from "@/components/MoodDashboard";
import {
  Activity,
  CheckCircle,
  XCircle,
  Calendar,
  Circle,
  Bot,
  MessageSquare,
  Users,
  Gamepad2,
  Brain,
  Puzzle,
  Zap,
  Server,
  Terminal,
  BarChart3,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  total: number;
  today: number;
  thisWeek: number;
  success: number;
  error: number;
  byType: Record<string, number>;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  model: string;
  status: "online" | "offline";
  lastActivity?: string;
  botToken?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, thisWeek: 0, success: 0, error: 0, byType: {} });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [agentHeartbeat, setAgentHeartbeat] = useState<string | null>(null);
  const [cronQueue, setCronQueue] = useState<{ pending: number; nextRun: string | null } | null>(null);
  const [activityToast, setActivityToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/activities/stats").then(r => r.json()),
      fetch("/api/agents").then(r => r.json()),
      fetch("/api/cron").then(r => r.ok ? r.json() : []),
    ]).then(([actStats, agentsData, cronJobs]) => {
      setStats({
        total: actStats.total || 0,
        today: actStats.today || 0,
        thisWeek: actStats.thisWeek ?? actStats.today ?? 0,
        success: actStats.byStatus?.success || 0,
        error: actStats.byStatus?.error || 0,
        byType: actStats.byType || {},
      });
      const loadedAgents: Agent[] = agentsData.agents || [];
      setAgents(loadedAgents);

      const mainAgent = loadedAgents.find((a) => a.id === "main") || loadedAgents[0];
      if (mainAgent?.lastActivity) {
        setAgentHeartbeat(mainAgent.lastActivity);
      }

      const jobs: Array<{ enabled?: boolean; nextRun?: string | null }> = Array.isArray(cronJobs) ? cronJobs : [];
      const enabledJobs = jobs.filter((j) => j.enabled !== false);
      const withNextRun = enabledJobs.filter((j) => j.nextRun);
      let nextRun: string | null = null;
      if (withNextRun.length > 0) {
        const earliest = withNextRun
          .map((j) => new Date(j.nextRun as string))
          .filter((d) => !Number.isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime())[0];
        if (earliest) nextRun = earliest.toISOString();
      }
      setCronQueue({ pending: enabledJobs.length, nextRun });
    }).catch(console.error);
  }, []);

  const handleNewActivity = (activity: ActivityItem) => {
    if (activity.status === "error") {
      const msg = activity.description || "Activity error";
      setActivityToast({ type: "error", message: msg.length > 160 ? msg.slice(0, 157) + "..." : msg });
      setTimeout(() => setActivityToast(null), 4000);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Activity Toast */}
      {activityToast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{
            backgroundColor: "rgba(15,23,42,0.95)",
            border: "1px solid var(--border)",
            color: activityToast.type === "error" ? "var(--error)" : "var(--success)",
            fontSize: "0.85rem",
          }}
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5">
              {activityToast.type === "error" ? "⚠️" : "✅"}
            </span>
            <div className="flex-1">
              <p className="font-semibold mb-0.5">
                {activityToast.type === "error" ? "Activity error" : "Activity"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {activityToast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{ 
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)',
            letterSpacing: '-1.5px'
          }}
        >
          🤖✨ Mara
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Resumen en tiempo real de la actividad de Mara y OpenClaw
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: isWorking ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.16)",
              color: isWorking ? "var(--success)" : "var(--text-muted)",
            }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isWorking ? "animate-pulse" : ""}`}
              style={{ backgroundColor: isWorking ? "var(--success)" : "var(--text-muted)" }}
            />
            Tenacitas {isWorking ? "está trabajando" : "idle"}
          </span>
          {agentHeartbeat && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "rgba(59,130,246,0.12)",
                color: "var(--info, #60a5fa)",
              }}
            >
              Último heartbeat:{" "}
              {formatDistanceToNow(new Date(agentHeartbeat), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid + Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4 md:mb-6">
        {/* Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatsCard
            title="Total Activities"
            value={stats.total.toLocaleString()}
            icon={<Activity className="w-5 h-5" />}
            iconColor="var(--info)"
          />
          <StatsCard
            title="Today"
            value={stats.today.toLocaleString()}
            icon={<Zap className="w-5 h-5" />}
            iconColor="var(--accent)"
          />
          <StatsCard
            title="This Week"
            value={stats.thisWeek.toLocaleString()}
            icon={<Calendar className="w-5 h-5" />}
            iconColor="var(--info)"
          />
          <StatsCard
            title="Successful"
            value={stats.success.toLocaleString()}
            icon={<CheckCircle className="w-5 h-5" />}
            iconColor="var(--success)"
          />
          <StatsCard
            title="Errors"
            value={stats.error.toLocaleString()}
            icon={<XCircle className="w-5 h-5" />}
            iconColor="var(--error)"
          />
        </div>

        {/* Weather Widget */}
        <div className="lg:col-span-1">
          <WeatherWidget />
        </div>
      </div>

      {/* Stats Dashboard: top types + success/error rate */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6 rounded-xl p-4"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <BarChart3 className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Tipos de acciones más frecuentes
          </h3>
          <ul className="space-y-1">
            {Object.entries(stats.byType)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([type, count]) => (
                <li key={type} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }} className="capitalize">{type.replace(/_/g, " ")}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{count.toLocaleString()}</span>
                </li>
              ))}
            {Object.keys(stats.byType).length === 0 && (
              <li className="text-sm" style={{ color: "var(--text-muted)" }}>No activity yet</li>
            )}
          </ul>
          <Link href="/analytics" className="text-xs mt-2 inline-block" style={{ color: "var(--accent)" }}>View analytics →</Link>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Percent className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Tasa de éxito / error
          </h3>
          {(() => {
            const totalResolved = stats.success + stats.error;
            const successRate = totalResolved > 0 ? Math.round((stats.success / totalResolved) * 100) : 0;
            const errorRate = totalResolved > 0 ? Math.round((stats.error / totalResolved) * 100) : 0;
            return (
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Éxito</span>
                  <span style={{ color: "var(--success)", fontWeight: 600 }}>{successRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Error</span>
                  <span style={{ color: "var(--error)", fontWeight: 600 }}>{errorRate}%</span>
                </div>
                {totalResolved === 0 && (
                  <span style={{ color: "var(--text-muted)" }}>No completed activities yet</span>
                )}
              </div>
            );
          })()}
          <Link href="/analytics" className="text-xs mt-2 inline-block" style={{ color: "var(--accent)" }}>View analytics →</Link>
        </div>
      </div>

      {/* Multi-Agent Status */}
      <div 
        className="mb-6 rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        <div 
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="accent-line" />
            <h2 
              className="text-base font-semibold"
              style={{ 
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)'
              }}
            >
              <Users className="inline-block w-5 h-5 mr-2 mb-1" />
              Multi-Agent System
            </h2>
          </div>
          <div className="flex gap-2">
            <Link
              href="/office"
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ 
                backgroundColor: 'var(--accent)',
                color: 'var(--text-primary)',
              }}
            >
              <Gamepad2 className="inline-block w-4 h-4 mr-1 mb-0.5" />
              Open Office
            </Link>
            <Link
              href="/agents"
              className="text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              View all →
            </Link>
          </div>
        </div>
        <div className="p-5">
          {cronQueue && (
            <div className="flex items-center justify-between mb-4 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span>
                Cola de tareas: {cronQueue.pending} cron job{cronQueue.pending === 1 ? "" : "s"} activos
              </span>
              {cronQueue.nextRun && (
                <span>
                  Próxima ejecución:{" "}
                  {new Date(cronQueue.nextRun).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 rounded-lg transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--card-elevated)',
                  border: `2px solid ${agent.color}`,
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">{agent.emoji}</div>
                  <Circle
                    className="w-2 h-2"
                    style={{
                      fill: agent.status === "online" ? "#4ade80" : "#6b7280",
                      color: agent.status === "online" ? "#4ade80" : "#6b7280",
                    }}
                  />
                </div>
                <div 
                  className="text-sm font-bold mb-1"
                  style={{ 
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {agent.name}
                </div>
                <div 
                  className="text-xs truncate mb-1"
                  style={{ color: 'var(--text-muted)' }}
                  title={agent.model}
                >
                  <Bot className="inline-block w-3 h-3 mr-1" />
                  {agent.model.split('/').pop()}
                </div>
                {agent.botToken && (
                  <div 
                    className="text-xs mt-1 flex items-center gap-1"
                    style={{ color: '#0088cc' }}
                  >
                    <MessageSquare className="w-3 h-3" />
                    Connected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Activity Feed */}
        <div 
          className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div 
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="accent-line" />
              <h2 
                className="text-base font-semibold"
                style={{ 
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)'
                }}
              >
                Recent Activity
              </h2>
            </div>
            <a
              href="/activity"
              className="text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              View all →
            </a>
          </div>
          <div className="p-0">
            <ActivityFeed
              limit={5}
              realtime
              onWorkStateChange={setIsWorking}
              onNewActivity={handleNewActivity}
            />
          </div>
        </div>

        {/* Mood + Quick Links */}
        <div className="space-y-4">
          <MoodDashboard />
          <div 
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div 
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="accent-line" />
                <h2 
                  className="text-base font-semibold"
                  style={{ 
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Quick Links
                </h2>
              </div>
            </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {[
              { href: "/cron", icon: Calendar, label: "Cron Jobs", color: "#a78bfa" },
              { href: "/actions", icon: Zap, label: "Quick Actions", color: "var(--accent)" },
              { href: "/system", icon: Server, label: "System", color: "var(--success)" },
              { href: "/logs", icon: Terminal, label: "Live Logs", color: "#60a5fa" },
              { href: "/memory", icon: Brain, label: "Memory", color: "#f59e0b" },
              { href: "/skills", icon: Puzzle, label: "Skills", color: "#4ade80" },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className="p-3 rounded-lg transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--card-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Notepad */}
          <div style={{ margin: "1rem", marginTop: "0.5rem" }}>
            <Notepad />
          </div>
        </div>
      </div>
    </div>
  );
}
