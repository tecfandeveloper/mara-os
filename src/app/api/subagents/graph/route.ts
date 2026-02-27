/**
 * GET /api/subagents/graph
 * Returns nodes (main + subagents) and edges (main -> subagent with token/message weight) for the communication graph.
 */
import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { homedir } from "os";
import { join } from "path";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || join(homedir(), ".openclaw") || "/root/.openclaw";

interface RawSession {
  key: string;
  updatedAt: number;
  totalTokens?: number;
  sessionId?: string;
}

function parseSessionKey(key: string): { type: string; subagentId?: string; isRunEntry: boolean } {
  const parts = key.split(":");
  if (parts.includes("run")) return { type: "unknown", isRunEntry: true };
  if (parts[2] === "subagent") return { type: "subagent", subagentId: parts[3], isRunEntry: false };
  if (parts[2] === "main") return { type: "main", isRunEntry: false };
  return { type: parts[2] || "unknown", isRunEntry: false };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const output = execSync("openclaw sessions list --json 2>/dev/null", {
      timeout: 10000,
      encoding: "utf-8",
    });
    const data = JSON.parse(output);
    const rawSessions: RawSession[] = data.sessions || [];

    const now = Date.now();
    const startMs = startDate ? new Date(startDate).getTime() : 0;
    const endMs = endDate ? new Date(endDate).getTime() : now + 86400000;

    const subagentTokens = new Map<string, number>();
    let mainTokens = 0;

    for (const raw of rawSessions) {
      const parsed = parseSessionKey(raw.key);
      if (parsed.isRunEntry) continue;
      const ts = raw.updatedAt;
      if (ts < startMs || ts > endMs) continue;
      const tokens = raw.totalTokens || 0;

      if (parsed.type === "main") {
        mainTokens += tokens;
      } else if (parsed.type === "subagent" && parsed.subagentId) {
        subagentTokens.set(
          parsed.subagentId,
          (subagentTokens.get(parsed.subagentId) || 0) + tokens
        );
      }
    }

    const nodes: { id: string; label: string; type: "main" | "subagent"; totalTokens: number }[] = [
      { id: "main", label: "Main", type: "main", totalTokens: mainTokens },
    ];
    const subagentIds = Array.from(subagentTokens.keys()).sort();
    subagentIds.forEach((id) => {
      nodes.push({
        id,
        label: id,
        type: "subagent",
        totalTokens: subagentTokens.get(id) || 0,
      });
    });

    const edges: { source: string; target: string; tokens: number }[] = subagentIds.map((id) => ({
      source: "main",
      target: id,
      tokens: subagentTokens.get(id) || 0,
    }));

    return NextResponse.json({
      nodes,
      edges,
    });
  } catch (error) {
    console.error("[subagents/graph] Error:", error);
    return NextResponse.json(
      { error: "Failed to build agent graph", nodes: [], edges: [] },
      { status: 500 }
    );
  }
}
