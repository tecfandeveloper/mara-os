/**
 * Sankey diagram data: tokens, tasks, or time flows
 * GET /api/analytics/sankey?flow=tokens|tasks|time&days=N
 */
import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { promises as fs } from "fs";
import { getDatabase, getDailyCost } from "@/lib/usage-queries";

const ACTIVITIES_DB_PATH = path.join(process.cwd(), "data", "activities.db");

function normalizeType(t: string): string {
  return t === "cron_run"
    ? "cron"
    : t === "file_read" || t === "file_write"
      ? "file"
      : t === "web_search"
        ? "search"
        : t === "message_sent"
          ? "message"
          : t === "tool_call" || t === "agent_action"
            ? "task"
            : t;
}

export interface SankeyNode {
  id: string;
  label: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flow = searchParams.get("flow") || "tasks";
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "30", 10)));

  if (!["tokens", "tasks", "time"].includes(flow)) {
    return NextResponse.json({ error: "Invalid flow" }, { status: 400 });
  }

  if (flow === "tokens") {
    const db = getDatabase();
    if (!db) {
      return NextResponse.json({
        nodes: [
          { id: "input", label: "Input" },
          { id: "output", label: "Output" },
        ],
        links: [],
      });
    }
    try {
      const daily = getDailyCost(db, days);
      let totalInput = 0;
      let totalOutput = 0;
      daily.forEach((d) => {
        totalInput += d.input ?? 0;
        totalOutput += d.output ?? 0;
      });
      const nodes: SankeyNode[] = [
        { id: "source", label: "Tokens" },
        { id: "input", label: "Input" },
        { id: "output", label: "Output" },
      ];
      const links: SankeyLink[] = [];
      if (totalInput > 0) links.push({ source: "source", target: "input", value: totalInput });
      if (totalOutput > 0) links.push({ source: "source", target: "output", value: totalOutput });
      return NextResponse.json({ nodes, links });
    } finally {
      db.close();
    }
  }

  // tasks / time: read from activities DB
  let activities: Array<{ type: string; status: string; timestamp: string }> = [];
  try {
    await fs.access(ACTIVITIES_DB_PATH);
    const db = new Database(ACTIVITIES_DB_PATH);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const rows = db
      .prepare(
        "SELECT type, status, timestamp FROM activities WHERE timestamp >= ? ORDER BY timestamp DESC"
      )
      .all(cutoffStr) as Array<{ type: string; status: string; timestamp: string }>;
    db.close();
    activities = rows;
  } catch {
    try {
      const { readFileSync } = await import("fs");
      const jsonPath = path.join(process.cwd(), "data", "activities.json");
      const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
      activities = Array.isArray(data)
        ? data.map((a: { type?: string; status?: string; timestamp?: string }) => ({
            type: a.type || "task",
            status: a.status || "success",
            timestamp: a.timestamp || new Date().toISOString(),
          }))
        : [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      activities = activities.filter((a) => a.timestamp >= cutoffStr);
    } catch {
      activities = [];
    }
  }

  if (flow === "tasks") {
    const typeStatusMap = new Map<string, number>();
    activities.forEach((a) => {
      const type = normalizeType(a.type);
      const key = `${type}\t${a.status}`;
      typeStatusMap.set(key, (typeStatusMap.get(key) || 0) + 1);
    });
    const typeSet = new Set<string>();
    const statusSet = new Set<string>();
    typeStatusMap.forEach((_, key) => {
      const [t, s] = key.split("\t");
      typeSet.add(t);
      statusSet.add(s);
    });
    const nodes: SankeyNode[] = [];
    typeSet.forEach((t) => nodes.push({ id: `type-${t}`, label: t }));
    statusSet.forEach((s) => nodes.push({ id: `status-${s}`, label: s }));
    const links: SankeyLink[] = [];
    typeStatusMap.forEach((value, key) => {
      const [t, s] = key.split("\t");
      links.push({ source: `type-${t}`, target: `status-${s}`, value });
    });
    return NextResponse.json({ nodes, links });
  }

  // flow === "time": hour band -> activity type (value = count)
  const hourBand = (h: number) => {
    if (h < 6) return "0-6";
    if (h < 12) return "6-12";
    if (h < 18) return "12-18";
    return "18-24";
  };
  const bandTypeMap = new Map<string, number>();
  activities.forEach((a) => {
    try {
      const h = new Date(a.timestamp).getHours();
      const band = hourBand(h);
      const type = normalizeType(a.type);
      const key = `${band}\t${type}`;
      bandTypeMap.set(key, (bandTypeMap.get(key) || 0) + 1);
    } catch {}
  });
  const bandSet = new Set<string>();
  const typeSet = new Set<string>();
  bandTypeMap.forEach((_, key) => {
    const [b, t] = key.split("\t");
    bandSet.add(b);
    typeSet.add(t);
  });
  const nodes: SankeyNode[] = [];
  ["0-6", "6-12", "12-18", "18-24"].forEach((b) => {
    if (bandSet.has(b)) nodes.push({ id: `band-${b}`, label: `${b}h` });
  });
  typeSet.forEach((t) => nodes.push({ id: `type-${t}`, label: t }));
  const links: SankeyLink[] = [];
  bandTypeMap.forEach((value, key) => {
    const [b, t] = key.split("\t");
    links.push({ source: `band-${b}`, target: `type-${t}`, value });
  });
  return NextResponse.json({ nodes, links });
}
