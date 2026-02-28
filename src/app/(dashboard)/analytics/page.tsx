"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ActivityLineChart } from "@/components/charts/ActivityLineChart";
import { ActivityPieChart } from "@/components/charts/ActivityPieChart";
import { HourlyHeatmap } from "@/components/charts/HourlyHeatmap";
import { ActivityHeatmap24x7 } from "@/components/charts/ActivityHeatmap24x7";
import { SuccessRateGauge } from "@/components/charts/SuccessRateGauge";
import { BarChart3, TrendingUp, Clock, Target, Gauge, Activity, Server } from "lucide-react";

interface AnalyticsData {
  byDay: { date: string; count: number }[];
  byType: { type: string; count: number }[];
  byHour: { hour: number; day: number; count: number }[];
  heatmapByDateHour?: { date: string; hour: number; count: number }[];
  heatmapDates?: string[];
  successRate: number;
  averageResponseTimeMs: number | null;
  successRateByType: { type: string; total: number; success: number; successRate: number }[];
  uptimeSeconds: number;
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.round(seconds)}s`;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics?heatmapDays=7")
      .then((r) => r.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className="p-4 md:p-8 flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
          />
          <span style={{ color: "var(--text-secondary)" }}>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-8" style={{ backgroundColor: "var(--background)" }}>
        <p style={{ color: "var(--error)" }}>Failed to load analytics data</p>
      </div>
    );
  }

  const totalThisWeek = data.byDay.reduce((sum, d) => sum + d.count, 0);
  const mostActiveDay = data.byDay.reduce(
    (max, d) => (d.count > max.count ? d : max),
    data.byDay[0]
  )?.date || "-";

  return (
    <div className="p-4 md:p-8" style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>
      <div className="mb-4 md:mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
          >
            📊 Analytics
          </h1>
          <p className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
            Insights and trends from agent activity
          </p>
        </div>
        <Link
          href="/sankey"
          className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: "var(--accent)", border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          Sankey diagrams →
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <div
          className="rounded-xl p-3 md:p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs md:text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Total This Week</p>
          <p className="text-xl md:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {totalThisWeek}
          </p>
        </div>
        <div
          className="rounded-xl p-3 md:p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs md:text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Most Active Day</p>
          <p className="text-xl md:text-2xl font-bold" style={{ color: "var(--accent)" }}>
            {mostActiveDay}
          </p>
        </div>
        <div
          className="rounded-xl p-3 md:p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs md:text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Top Activity Type</p>
          <p className="text-xl md:text-2xl font-bold capitalize" style={{ color: "var(--info)" }}>
            {data.byType[0]?.type || "-"}
          </p>
        </div>
        <div
          className="rounded-xl p-3 md:p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs md:text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Success Rate</p>
          <p className="text-xl md:text-2xl font-bold" style={{ color: "var(--success)" }}>
            {data.successRate.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-4 md:mb-6">
        <h2
          className="text-lg md:text-xl font-bold mb-3 md:mb-4"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          Performance Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
          <div
            className="rounded-xl p-3 md:p-4 flex items-center gap-3"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Gauge className="w-8 h-8 shrink-0" style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-xs md:text-sm mb-0.5" style={{ color: "var(--text-secondary)" }}>Avg. response time</p>
              <p className="text-lg md:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {data.averageResponseTimeMs != null
                  ? data.averageResponseTimeMs >= 1000
                    ? `${(data.averageResponseTimeMs / 1000).toFixed(1)}s`
                    : `${Math.round(data.averageResponseTimeMs)}ms`
                  : "—"}
              </p>
            </div>
          </div>
          <div
            className="rounded-xl p-3 md:p-4 flex items-center gap-3"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Server className="w-8 h-8 shrink-0" style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-xs md:text-sm mb-0.5" style={{ color: "var(--text-secondary)" }}>Server uptime</p>
              <p className="text-lg md:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {formatUptime(data.uptimeSeconds ?? 0)}
              </p>
            </div>
          </div>
          <div
            className="rounded-xl p-3 md:p-4 flex items-center gap-3"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Activity className="w-8 h-8 shrink-0" style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-xs md:text-sm mb-0.5" style={{ color: "var(--text-secondary)" }}>Success by type</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {(data.successRateByType ?? []).length} activity types
              </p>
            </div>
          </div>
        </div>
        {(data.successRateByType ?? []).length > 0 && (
          <div
            className="rounded-xl p-4 md:p-6"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Success rate by task type
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left py-2 pr-4" style={{ color: "var(--text-secondary)" }}>Type</th>
                    <th className="text-right py-2 pr-4" style={{ color: "var(--text-secondary)" }}>Total</th>
                    <th className="text-right py-2 pr-4" style={{ color: "var(--text-secondary)" }}>Success</th>
                    <th className="text-right py-2" style={{ color: "var(--text-secondary)" }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.successRateByType ?? []).map((row) => (
                    <tr key={row.type} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-2 pr-4 capitalize" style={{ color: "var(--text-primary)" }}>{row.type}</td>
                      <td className="py-2 pr-4 text-right" style={{ color: "var(--text-primary)" }}>{row.total}</td>
                      <td className="py-2 pr-4 text-right" style={{ color: "var(--success)" }}>{row.success}</td>
                      <td className="py-2 text-right font-medium" style={{ color: row.successRate >= 80 ? "var(--success)" : row.successRate >= 50 ? "var(--warning)" : "var(--error)" }}>
                        {row.successRate.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Activity Over Time */}
        <div
          className="rounded-xl p-4 md:p-6"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" style={{ color: "var(--accent)" }} />
            <h2
              className="text-lg md:text-xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              Activity Over Time
            </h2>
          </div>
          <ActivityLineChart data={data.byDay} />
        </div>

        {/* Activity by Type */}
        <div
          className="rounded-xl p-4 md:p-6"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5" style={{ color: "var(--accent)" }} />
            <h2
              className="text-lg md:text-xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              Activity by Type
            </h2>
          </div>
          <ActivityPieChart data={data.byType} />
        </div>

        {/* Hourly Heatmap (24x7, click to filter activity feed) */}
        <div
          className="rounded-xl p-4 md:p-6"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <Clock className="w-4 h-4 md:w-5 md:h-5" style={{ color: "var(--accent)" }} />
            <h2
              className="text-lg md:text-xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              Activity by Hour
            </h2>
          </div>
          {data.heatmapDates && data.heatmapByDateHour ? (
            <ActivityHeatmap24x7
              heatmapByDateHour={data.heatmapByDateHour}
              heatmapDates={data.heatmapDates}
              onCellClick={(date) => router.push(`/activity?startDate=${date}&endDate=${date}`)}
              showExport
            />
          ) : (
            <HourlyHeatmap data={data.byHour} />
          )}
        </div>

        {/* Success Rate Gauge */}
        <div
          className="rounded-xl p-4 md:p-6"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <Target className="w-4 h-4 md:w-5 md:h-5" style={{ color: "var(--accent)" }} />
            <h2
              className="text-lg md:text-xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              Success Rate
            </h2>
          </div>
          <SuccessRateGauge rate={data.successRate} />
        </div>
      </div>
    </div>
  );
}
