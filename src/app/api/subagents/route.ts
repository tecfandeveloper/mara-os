/**
 * GET /api/subagents
 * List sub-agent sessions (from openclaw sessions list), with derived state and optional agent display info.
 * Returns 200 with empty list when openclaw is not available (e.g. not in PATH) so the dashboard still works.
 */
import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || join(homedir(), ".openclaw") || "/root/.openclaw";
const RUNNING_AGE_MS = 5 * 60 * 1000; // 5 min

interface RawSession {
  key: string;
  kind: string;
  updatedAt: number;
  ageMs: number;
  sessionId?: string;
  abortedLastRun?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  totalTokensFresh?: boolean;
  model?: string;
  modelProvider?: string;
  contextTokens?: number;
}

export type SubagentState = "running" | "completed" | "failed";

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

function parseSessionKey(key: string): { type: string; subagentId?: string; isRunEntry: boolean } {
  const parts = key.split(":");
  if (parts.includes("run")) {
    return { type: "unknown", isRunEntry: true };
  }
  if (parts[2] === "subagent") {
    return { type: "subagent", subagentId: parts[3], isRunEntry: false };
  }
  return { type: parts[2] || "unknown", isRunEntry: false };
}

function deriveState(ageMs: number, aborted: boolean): SubagentState {
  if (aborted) return "failed";
  if (ageMs < RUNNING_AGE_MS) return "running";
  return "completed";
}

function getSubagentDisplayMap(): Map<string, { name: string; emoji: string; color: string }> {
  const map = new Map<string, { name: string; emoji: string; color: string }>();
  try {
    const configPath = join(OPENCLAW_DIR, "openclaw.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    const rawAgents: any[] = Array.isArray(config?.agents?.list) && config.agents.list.length > 0
      ? config.agents.list
      : [];
    const defaultEmoji = "🤖";
    const defaultColor = "#666666";
    for (const agent of rawAgents) {
      const subagents = agent.subagents?.allowAgents || [];
      for (const subId of subagents) {
        const subConfig = rawAgents.find((a: any) => a.id === subId);
        const name = subConfig?.name || subId;
        const emoji = subConfig?.ui?.emoji || defaultEmoji;
        const color = subConfig?.ui?.color || defaultColor;
        if (!map.has(subId)) map.set(subId, { name, emoji, color });
      }
    }
  } catch {
    // ignore
  }
  return map;
}

export async function GET() {
  try {
    const output = execSync("openclaw sessions list --json 2>/dev/null", {
      timeout: 10000,
      encoding: "utf-8",
    });
    const data = JSON.parse(output);
    const rawSessions: RawSession[] = data.sessions || [];
    const displayMap = getSubagentDisplayMap();

    const subagents: SubagentSession[] = rawSessions
      .reduce<SubagentSession[]>((acc, raw) => {
        const parsed = parseSessionKey(raw.key);
        if (parsed.isRunEntry || parsed.type !== "subagent" || !parsed.subagentId) return acc;

        const totalTokens = raw.totalTokens || 0;
        const contextTokens = raw.contextTokens || 0;
        const contextUsedPercent =
          contextTokens > 0 && raw.totalTokensFresh
            ? Math.round((totalTokens / contextTokens) * 100)
            : null;
        const aborted = raw.abortedLastRun || false;
        const state = deriveState(raw.ageMs || 0, aborted);

        const display = displayMap.get(parsed.subagentId);

        acc.push({
          id: raw.key,
          key: raw.key,
          subagentId: parsed.subagentId,
          sessionId: raw.sessionId || null,
          updatedAt: raw.updatedAt,
          ageMs: raw.ageMs,
          model: raw.model || "unknown",
          modelProvider: raw.modelProvider || "anthropic",
          inputTokens: raw.inputTokens || 0,
          outputTokens: raw.outputTokens || 0,
          totalTokens,
          contextUsedPercent,
          aborted,
          state,
          name: display?.name,
          emoji: display?.emoji,
          color: display?.color,
        });
        return acc;
      }, []);

    subagents.sort((a, b) => b.updatedAt - a.updatedAt);

    return NextResponse.json({ subagents, total: subagents.length });
  } catch (error) {
    console.error("[subagents] Error listing subagents:", error);
    // Return 200 with empty list so dashboard still works when openclaw is missing or fails
    return NextResponse.json({ subagents: [], total: 0, _meta: { error: "openclaw unavailable or failed" } });
  }
}
