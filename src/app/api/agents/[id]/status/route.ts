import { NextResponse } from "next/server";
import { readFileSync, readdirSync, statSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { homedir } from "os";

export const dynamic = "force-dynamic";

function getConfig() {
  const openclawDir = process.env.OPENCLAW_DIR || join(homedir(), ".openclaw") || "/root/.openclaw";
  const configPath = join(openclawDir, "openclaw.json");
  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  const workspaceDefault =
    config?.agents?.defaults?.workspace ||
    process.env.OPENCLAW_WORKSPACE ||
    join(openclawDir, "workspace");

  const rawAgents: any[] = Array.isArray(config?.agents?.list) && config.agents.list.length > 0
    ? config.agents.list
    : [{ id: "main", name: process.env.NEXT_PUBLIC_AGENT_NAME || "Mission Control", workspace: workspaceDefault, model: config?.agents?.defaults?.model }];

  return { config, rawAgents };
}

function getSessionsForAgent(agentId: string) {
  try {
    const out = execSync("openclaw sessions list --json 2>/dev/null", {
      encoding: "utf-8",
      timeout: 10000,
    });
    const parsed = JSON.parse(out);
    const sessions = (parsed.sessions || []).filter((s: any) => {
      const key = String(s.key || "");
      return key.split(":")[1] === agentId;
    });

    return sessions.map((s: any) => ({
      key: s.key,
      model: s.model || "unknown",
      updatedAt: s.updatedAt,
      inputTokens: s.inputTokens || 0,
      outputTokens: s.outputTokens || 0,
      totalTokens: s.totalTokens || 0,
      abortedLastRun: !!s.abortedLastRun,
    }));
  } catch {
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { config, rawAgents } = getConfig();

    const agent = rawAgents.find((a: any) => a.id === id);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const resolvedWorkspace = agent.workspace || config?.agents?.defaults?.workspace || process.env.OPENCLAW_WORKSPACE || join(process.env.OPENCLAW_DIR || join(homedir(), ".openclaw") || "/root/.openclaw", "workspace");
    const memoryPath = join(resolvedWorkspace, "memory");
    let recentFiles: Array<{ date: string; size: number; modified: string }> = [];

    try {
      const files = readdirSync(memoryPath).filter((f) => f.match(/^\d{4}-\d{2}-\d{2}\.md$/));
      recentFiles = files
        .map((file) => {
          const stat = statSync(join(memoryPath, file));
          return {
            date: file.replace(".md", ""),
            size: stat.size,
            modified: stat.mtime.toISOString(),
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7);
    } catch {
      // no memory dir yet
    }

    const sessions = getSessionsForAgent(id);
    const telegramAccount = config.channels?.telegram?.accounts?.[id];

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.id === "main" ? (process.env.NEXT_PUBLIC_AGENT_NAME || "Mara") : agent.name,
        model: agent.model?.primary || config?.agents?.defaults?.model?.primary || "unknown",
        workspace: resolvedWorkspace,
        dmPolicy: telegramAccount?.dmPolicy || config.channels?.telegram?.dmPolicy,
        allowAgents: agent.subagents?.allowAgents || [],
        telegramConfigured: !!telegramAccount?.botToken || !!config?.channels?.telegram?.botToken,
      },
      memory: { recentFiles },
      sessions,
    });
  } catch (error) {
    console.error("Error getting agent status:", error);
    return NextResponse.json(
      { error: "Failed to get agent status" },
      { status: 500 }
    );
  }
}
