import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import {
  getDatabase,
  getCostSummary,
  getCostByAgent,
  getCostByModel,
  getDailyCost,
  getHourlyCost,
} from "@/lib/usage-queries";
import { calculateCost, normalizeModelId } from "@/lib/pricing";
import { execSync } from "child_process";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "usage-tracking.db");
const DEFAULT_BUDGET = Number(process.env.MISSION_CONTROL_BUDGET_USD || 100);

type SessionRow = {
  key: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

function deriveAgentIdFromKey(key: string): string {
  const p = key.split(":");
  return p[1] || "main";
}

function getLiveUsageFromSessions() {
  const out = execSync("openclaw sessions list --json 2>/dev/null", {
    encoding: "utf-8",
    timeout: 10000,
  });

  const parsed = JSON.parse(out);
  const sessions: SessionRow[] = parsed.sessions || [];

  const byAgentMap = new Map<string, { cost: number; tokens: number; inputTokens: number; outputTokens: number }>();
  const byModelMap = new Map<string, { cost: number; tokens: number; inputTokens: number; outputTokens: number }>();

  let totalCost = 0;
  let totalInput = 0;
  let totalOutput = 0;

  for (const s of sessions) {
    const agent = deriveAgentIdFromKey(s.key || "agent:main:main");
    const model = normalizeModelId(s.model || "unknown");
    const input = s.inputTokens || 0;
    const output = s.outputTokens || 0;
    const tokens = s.totalTokens || input + output;
    const cost = calculateCost(model, input, output);

    totalCost += cost;
    totalInput += input;
    totalOutput += output;

    const a = byAgentMap.get(agent) || { cost: 0, tokens: 0, inputTokens: 0, outputTokens: 0 };
    a.cost += cost;
    a.tokens += tokens;
    a.inputTokens += input;
    a.outputTokens += output;
    byAgentMap.set(agent, a);

    const m = byModelMap.get(model) || { cost: 0, tokens: 0, inputTokens: 0, outputTokens: 0 };
    m.cost += cost;
    m.tokens += tokens;
    m.inputTokens += input;
    m.outputTokens += output;
    byModelMap.set(model, m);
  }

  const byAgent = Array.from(byAgentMap.entries())
    .map(([agent, d]) => ({
      agent,
      ...d,
      percentOfTotal: totalCost > 0 ? (d.cost / totalCost) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  const byModel = Array.from(byModelMap.entries())
    .map(([model, d]) => ({
      model,
      ...d,
      percentOfTotal: totalCost > 0 ? (d.cost / totalCost) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  const now = new Date();
  const hour = `${String(now.getHours()).padStart(2, "0")}:00`;

  return {
    today: totalCost,
    yesterday: 0,
    thisMonth: totalCost,
    lastMonth: 0,
    projected: totalCost,
    budget: DEFAULT_BUDGET,
    byAgent,
    byModel,
    daily: [{ date: now.toISOString().slice(5, 10), cost: Number(totalCost.toFixed(4)), input: totalInput, output: totalOutput }],
    hourly: [{ hour, cost: Number(totalCost.toFixed(4)) }],
    message: "Live fallback from openclaw sessions (usage-tracking.db not found yet)",
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const timeframe = searchParams.get("timeframe") || "30d";

  const days = parseInt(timeframe.replace(/\D/g, ""), 10) || 30;

  try {
    const db = getDatabase(DB_PATH);

    if (!db) {
      try {
        return NextResponse.json(getLiveUsageFromSessions());
      } catch {
        return NextResponse.json({
          today: 0,
          yesterday: 0,
          thisMonth: 0,
          lastMonth: 0,
          projected: 0,
          budget: DEFAULT_BUDGET,
          byAgent: [],
          byModel: [],
          daily: [],
          hourly: [],
          message: "No usage data yet. Run: npx tsx scripts/collect-usage.ts",
        });
      }
    }

    const summary = getCostSummary(db);
    const byAgent = getCostByAgent(db, days);
    const byModel = getCostByModel(db, days);
    const daily = getDailyCost(db, days);
    const hourly = getHourlyCost(db);

    db.close();

    return NextResponse.json({
      ...summary,
      budget: DEFAULT_BUDGET,
      byAgent,
      byModel,
      daily,
      hourly,
    });
  } catch (error) {
    console.error("Error fetching cost data:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { budget, alerts } = body;

    return NextResponse.json({
      success: true,
      budget,
      alerts,
    });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    );
  }
}
