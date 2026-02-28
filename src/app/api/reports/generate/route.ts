import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getActivities } from "@/lib/activities-db";
import { getDatabase } from "@/lib/usage-queries";
import path from "path";
import { saveReport, type SharedReportPayload } from "@/lib/reports-shared";
import { randomUUID } from "crypto";

const USAGE_DB_PATH = path.join(process.cwd(), "data", "usage-tracking.db");

function buildPayload(startDate: string, endDate: string): SharedReportPayload {
  const generatedAt = new Date().toISOString();

  // Activity in range (startDate/endDate are YYYY-MM-DD; activities-db uses timestamp <= datetime(endDate, '+1 day'))
  const { activities, total: activityTotal } = getActivities({
    startDate: `${startDate}T00:00:00.000Z`,
    endDate,
    limit: 50000,
    sort: "oldest",
  });

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const a of activities) {
    byType[a.type] = (byType[a.type] || 0) + 1;
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  }
  const success = byStatus.success || 0;
  const error = byStatus.error || 0;
  const resolved = success + error;
  const successRate = resolved > 0 ? Math.round((success / resolved) * 100) : 0;

  // Cost in range (from usage_snapshots)
  let costTotal = 0;
  const byModel: Array<{ model: string; cost: number; percentOfTotal: number }> = [];
  const daily: Array<{ date: string; cost: number; input: number; output: number }> = [];

  const db = getDatabase(USAGE_DB_PATH);
  if (db) {
    try {
      const modelRows = db.prepare(`
        SELECT model, SUM(cost) as cost
        FROM usage_snapshots
        WHERE date >= ? AND date <= ?
        GROUP BY model
        ORDER BY cost DESC
      `).all(startDate, endDate) as Array<{ model: string; cost: number }>;

      costTotal = modelRows.reduce((s, r) => s + r.cost, 0);
      for (const r of modelRows) {
        byModel.push({
          model: r.model,
          cost: Math.round(r.cost * 100) / 100,
          percentOfTotal: costTotal > 0 ? Math.round((r.cost / costTotal) * 100) : 0,
        });
      }

      const dailyRows = db.prepare(`
        SELECT date, SUM(cost) as cost, SUM(input_tokens) as input, SUM(output_tokens) as output
        FROM usage_snapshots
        WHERE date >= ? AND date <= ?
        GROUP BY date
        ORDER BY date ASC
      `).all(startDate, endDate) as Array<{ date: string; cost: number; input: number; output: number }>;

      for (const r of dailyRows) {
        daily.push({
          date: r.date.slice(5),
          cost: Math.round(r.cost * 100) / 100,
          input: r.input || 0,
          output: r.output || 0,
        });
      }
    } finally {
      db.close();
    }
  }

  return {
    startDate,
    endDate,
    generatedAt,
    activity: {
      total: activityTotal,
      byType,
      byStatus,
      successRate,
    },
    cost: {
      total: Math.round(costTotal * 100) / 100,
      byModel,
      daily,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const startDate = typeof body.startDate === "string" ? body.startDate.trim().slice(0, 10) : null;
    const endDate = typeof body.endDate === "string" ? body.endDate.trim().slice(0, 10) : null;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    if (start > end) {
      return NextResponse.json({ error: "startDate must be before endDate" }, { status: 400 });
    }

    const payload = buildPayload(startDate, endDate);
    const token = randomUUID().replace(/-/g, "").slice(0, 32);
    const { expiresAt } = saveReport(token, payload);

    return NextResponse.json({
      reportId: token,
      token,
      expiresAt,
      summary: {
        startDate: payload.startDate,
        endDate: payload.endDate,
        activityTotal: payload.activity.total,
        costTotal: payload.cost.total,
      },
    });
  } catch (error) {
    console.error("[reports/generate] Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
