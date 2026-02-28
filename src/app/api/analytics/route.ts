import { NextRequest, NextResponse } from "next/server";
import { format, subDays, startOfDay } from "date-fns";
import Database from "better-sqlite3";
import path from "path";
import { promises as fs } from "fs";

const DB_PATH = path.join(process.cwd(), "data", "activities.db");

interface ActivityRow {
  type: string;
  status: string;
  timestamp: string;
  duration_ms?: number | null;
}

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

export async function GET(request: NextRequest): Promise<NextResponse<AnalyticsData>> {
  const { searchParams } = new URL(request.url);
  const heatmapDays = Math.min(14, Math.max(1, parseInt(searchParams.get("heatmapDays") || "0", 10)));

  // Try SQLite first, fallback to JSON
  let activities: ActivityRow[] = [];

  try {
    await fs.access(DB_PATH);
    const db = new Database(DB_PATH);
    const rows = db.prepare("SELECT type, status, timestamp, duration_ms FROM activities ORDER BY timestamp DESC").all() as ActivityRow[];
    db.close();
    activities = rows;
  } catch {
    // Fallback to JSON
    try {
      const { readFileSync } = await import("fs");
      const jsonPath = path.join(process.cwd(), "data", "activities.json");
      const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
      activities = Array.isArray(data) ? data : [];
    } catch {}
  }

  // Last 7 days activity count
  const today = new Date();
  const byDay: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const displayDate = format(date, "MMM d");
    const count = activities.filter((a) => {
      return a.timestamp.startsWith(dateStr);
    }).length;
    byDay.push({ date: displayDate, count });
  }

  // Activity by type
  const typeMap = new Map<string, number>();
  activities.forEach((a) => {
    const normalized = a.type === "cron_run" ? "cron" :
                       a.type === "file_read" || a.type === "file_write" ? "file" :
                       a.type === "web_search" ? "search" :
                       a.type === "message_sent" ? "message" :
                       a.type === "tool_call" || a.type === "agent_action" ? "task" : a.type;
    typeMap.set(normalized, (typeMap.get(normalized) || 0) + 1);
  });
  const byType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Activity by hour/day heatmap
  const hourDayMap = new Map<string, number>();
  activities.forEach((a) => {
    try {
      const d = new Date(a.timestamp);
      const hour = d.getHours();
      const day = d.getDay();
      const key = `${hour}-${day}`;
      hourDayMap.set(key, (hourDayMap.get(key) || 0) + 1);
    } catch {}
  });

  const byHour: { hour: number; day: number; count: number }[] = [];
  hourDayMap.forEach((count, key) => {
    const [hour, day] = key.split("-").map(Number);
    byHour.push({ hour, day, count });
  });

  let heatmapByDateHour: { date: string; hour: number; count: number }[] | undefined;
  let heatmapDates: string[] | undefined;
  if (heatmapDays > 0) {
    const dateHourMap = new Map<string, number>();
    const today = startOfDay(new Date());
    const dates: string[] = [];
    for (let i = heatmapDays - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      dates.push(dateStr);
    }
    activities.forEach((a) => {
      try {
        const ts = a.timestamp.slice(0, 10);
        if (!dates.includes(ts)) return;
        const hour = new Date(a.timestamp).getHours();
        const key = `${ts}-${hour}`;
        dateHourMap.set(key, (dateHourMap.get(key) || 0) + 1);
      } catch {}
    });
    heatmapByDateHour = [];
    dateHourMap.forEach((count, key) => {
      const parts = key.split("-");
      const hourNum = parseInt(parts[parts.length - 1], 10);
      const dateStr = parts.slice(0, 3).join("-");
      if (dateStr && !isNaN(hourNum)) {
        heatmapByDateHour!.push({ date: dateStr, hour: hourNum, count });
      }
    });
    heatmapDates = dates;
  }

  // Success rate
  const successCount = activities.filter((a) => a.status === "success").length;
  const successRate = activities.length > 0 ? (successCount / activities.length) * 100 : 0;

  // Average response time (only activities with duration_ms)
  const withDuration = activities.filter((a) => a.duration_ms != null && a.duration_ms > 0);
  const averageResponseTimeMs =
    withDuration.length > 0
      ? withDuration.reduce((s, a) => s + (a.duration_ms ?? 0), 0) / withDuration.length
      : null;

  // Success rate by type (normalize type names like in byType)
  const normalizeType = (t: string) =>
    t === "cron_run" ? "cron" : t === "file_read" || t === "file_write" ? "file" : t === "web_search" ? "search" : t === "message_sent" ? "message" : t === "tool_call" || t === "agent_action" ? "task" : t;
  const byTypeMap = new Map<string, { total: number; success: number }>();
  activities.forEach((a) => {
    const type = normalizeType(a.type);
    const cur = byTypeMap.get(type) ?? { total: 0, success: 0 };
    cur.total += 1;
    if (a.status === "success") cur.success += 1;
    byTypeMap.set(type, cur);
  });
  const successRateByType = Array.from(byTypeMap.entries())
    .map(([type, { total, success }]) => ({
      type,
      total,
      success,
      successRate: total > 0 ? (success / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Server uptime (Mission Control process)
  const uptimeSeconds = process.uptime();

  const payload: AnalyticsData = {
    byDay,
    byType,
    byHour,
    successRate,
    averageResponseTimeMs,
    successRateByType,
    uptimeSeconds,
  };
  if (heatmapByDateHour) payload.heatmapByDateHour = heatmapByDateHour;
  if (heatmapDates) payload.heatmapDates = heatmapDates;
  return NextResponse.json(payload);
}
