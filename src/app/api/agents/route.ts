import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { execSync } from "child_process";
import { normalizeModelId } from "@/lib/pricing";

export const dynamic = "force-dynamic";

interface Agent {
  id: string;
  name?: string;
  emoji: string;
  color: string;
  model: string;
  workspace: string;
  dmPolicy?: string;
  allowAgents?: string[];
  allowAgentsDetails?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  botToken?: string;
  status: "online" | "offline";
  lastActivity?: string;
  activeSessions: number;
}

const DEFAULT_AGENT_CONFIG: Record<string, { emoji: string; color: string; name?: string }> = {
  main: {
    emoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "🤖",
    color: "#ff6b35",
    name: process.env.NEXT_PUBLIC_AGENT_NAME || "Mission Control",
  },
};

function getAgentDisplayInfo(agentId: string, agentConfig: any): { emoji: string; color: string; name: string } {
  const configEmoji = agentConfig?.ui?.emoji;
  const configColor = agentConfig?.ui?.color;
  const configName = agentConfig?.name;
  const defaults = DEFAULT_AGENT_CONFIG[agentId];

  return {
    emoji: configEmoji || defaults?.emoji || "🤖",
    color: configColor || defaults?.color || "#666666",
    name: configName || defaults?.name || agentId,
  };
}

function getLiveSessionCounts(): Map<string, { count: number; latestModel?: string }> {
  const out = execSync("openclaw sessions list --json 2>/dev/null", {
    encoding: "utf-8",
    timeout: 10000,
  });

  const parsed = JSON.parse(out);
  const sessions = parsed.sessions || [];
  const map = new Map<string, { count: number; latestModel?: string; updatedAt: number }>();

  for (const s of sessions) {
    const key = String(s.key || "");
    const parts = key.split(":");
    const agentId = parts[1] || "main";
    const current = map.get(agentId) || { count: 0, latestModel: undefined, updatedAt: 0 };
    current.count += 1;
    if ((s.updatedAt || 0) >= current.updatedAt) {
      current.latestModel = s.model || current.latestModel;
      current.updatedAt = s.updatedAt || current.updatedAt;
    }
    map.set(agentId, current);
  }

  const outMap = new Map<string, { count: number; latestModel?: string }>();
  for (const [k, v] of map.entries()) outMap.set(k, { count: v.count, latestModel: v.latestModel });
  return outMap;
}

export async function GET() {
  try {
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

    let sessionCounts = new Map<string, { count: number; latestModel?: string }>();
    try {
      sessionCounts = getLiveSessionCounts();
    } catch {
      // keep fallback values
    }

    const agents: Agent[] = rawAgents.map((agent: any) => {
      const resolvedWorkspace = agent.workspace || workspaceDefault;
      const agentInfo = getAgentDisplayInfo(agent.id, agent);
      const telegramAccount = config.channels?.telegram?.accounts?.[agent.id];
      const botToken = telegramAccount?.botToken;

      const memoryPath = join(resolvedWorkspace, "memory");
      let lastActivity = undefined;
      let status: "online" | "offline" = "offline";

      try {
        const today = new Date().toISOString().split("T")[0];
        const memoryFile = join(memoryPath, `${today}.md`);
        const stat = require("fs").statSync(memoryFile);
        lastActivity = stat.mtime.toISOString();
        status = Date.now() - stat.mtime.getTime() < 5 * 60 * 1000 ? "online" : "offline";
      } catch {
        // no activity
      }

      const allowAgents = agent.subagents?.allowAgents || [];
      const allowAgentsDetails = allowAgents.map((subagentId: string) => {
        const subagentConfig = rawAgents.find((a: any) => a.id === subagentId);
        if (subagentConfig) {
          const subagentInfo = getAgentDisplayInfo(subagentId, subagentConfig);
          return {
            id: subagentId,
            name: subagentConfig.name || subagentInfo.name,
            emoji: subagentInfo.emoji,
            color: subagentInfo.color,
          };
        }
        const fallbackInfo = getAgentDisplayInfo(subagentId, null);
        return {
          id: subagentId,
          name: fallbackInfo.name,
          emoji: fallbackInfo.emoji,
          color: fallbackInfo.color,
        };
      });

      const live = sessionCounts.get(agent.id);
      const fallbackModel = agent.model?.primary || config.agents.defaults.model.primary;

      return {
        id: agent.id,
        name: agent.id === "main" ? (process.env.NEXT_PUBLIC_AGENT_NAME || "Mara") : (agent.name || agentInfo.name),
        emoji: agentInfo.emoji,
        color: agentInfo.color,
        model: normalizeModelId(live?.latestModel || fallbackModel),
        workspace: resolvedWorkspace,
        dmPolicy: telegramAccount?.dmPolicy || config.channels?.telegram?.dmPolicy || "pairing",
        allowAgents,
        allowAgentsDetails,
        botToken: botToken ? "configured" : undefined,
        status,
        lastActivity,
        activeSessions: live?.count || 0,
      };
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error reading agents:", error);
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 });
  }
}
