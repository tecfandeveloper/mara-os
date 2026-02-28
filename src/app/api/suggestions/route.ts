import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getActivityStats } from "@/lib/activities-db";
import { getDatabase, getCostByModel } from "@/lib/usage-queries";
import path from "path";
import { getDismissedIds } from "@/lib/suggestions-db";
import { runSuggestions } from "@/lib/suggestions-engine";
import { execSync } from "child_process";

const USAGE_DB_PATH = path.join(process.cwd(), "data", "usage-tracking.db");

function getCronJobs(): Array<{ id: string; name: string; enabled?: boolean; nextRun?: string | null }> {
  try {
    const output = execSync("openclaw cron list --json --all 2>/dev/null", {
      timeout: 10000,
      encoding: "utf-8",
    });
    const data = JSON.parse(output);
    const jobs = (data.jobs || []) as Array<Record<string, unknown>>;
    return jobs.map((job) => ({
      id: String(job.id ?? ""),
      name: String(job.name ?? "Unnamed"),
      enabled: job.enabled as boolean | undefined,
      nextRun:
        job.state && typeof (job.state as Record<string, unknown>).nextRunAtMs === "number"
          ? new Date((job.state as Record<string, number>).nextRunAtMs).toISOString()
          : null,
    }));
  } catch {
    return [];
  }
}

async function getAgents(baseUrl: string, cookie: string): Promise<Array<{ id: string; lastActivity?: string }>> {
  try {
    const res = await fetch(`${baseUrl}/api/agents`, { headers: { cookie } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.agents || [];
    return list.map((a: { id: string; lastActivity?: string }) => ({ id: a.id, lastActivity: a.lastActivity }));
  } catch {
    return [];
  }
}

async function getAnalytics(baseUrl: string, cookie: string): Promise<Array<{ hour: number; day: number; count: number }>> {
  try {
    const res = await fetch(`${baseUrl}/api/analytics`, { headers: { cookie } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.byHour || [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const activityStats = getActivityStats();

    let costsByModel: Array<{ model: string; cost: number; percentOfTotal: number }> = [];
    const db = getDatabase(USAGE_DB_PATH);
    if (db) {
      const byModel = getCostByModel(db, 30);
      costsByModel = byModel.map((m) => ({
        model: m.model,
        cost: m.cost,
        percentOfTotal: m.percentOfTotal,
      }));
      db.close();
    }

    const cronJobs = getCronJobs();

    const baseUrl = request.nextUrl.origin;
    const cookie = request.headers.get("cookie") || "";
    const [agents, analyticsByHour] = await Promise.all([
      getAgents(baseUrl, cookie),
      getAnalytics(baseUrl, cookie),
    ]);

    const context = {
      activityStats,
      costsByModel,
      cronJobs,
      agents,
      analyticsByHour,
    };

    const all = runSuggestions(context);
    const dismissed = getDismissedIds();
    const suggestions = all.filter((s) => !dismissed.has(s.id));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[suggestions] Error:", error);
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 });
  }
}
