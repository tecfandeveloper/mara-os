import { NextResponse } from "next/server";
import { readFileSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export const dynamic = "force-dynamic";

type OfficeAgent = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  currentTask: string;
  isActive: boolean;
};

const DEFAULT_COLORS = ["#ff6b35", "#4ade80", "#a855f7", "#0077b5", "#ec4899", "#f97316"];

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

function getAgentStatusFromFiles(workspace: string): { isActive: boolean; currentTask: string; lastSeen: number } {
  try {
    const today = new Date().toISOString().split("T")[0];
    const memoryFile = join(workspace, "memory", `${today}.md`);
    const stat = statSync(memoryFile);
    const lastSeen = stat.mtime.getTime();
    const minutesSinceUpdate = (Date.now() - lastSeen) / 1000 / 60;

    if (minutesSinceUpdate < 5) return { isActive: true, currentTask: "ACTIVE", lastSeen };
    if (minutesSinceUpdate < 30) return { isActive: false, currentTask: "IDLE", lastSeen };
    return { isActive: false, currentTask: "SLEEPING", lastSeen };
  } catch {
    return { isActive: false, currentTask: "SLEEPING", lastSeen: 0 };
  }
}

export async function GET() {
  try {
    const { config, rawAgents } = getConfig();

    const agents: OfficeAgent[] = rawAgents.map((agent: any, index: number) => {
      const resolvedWorkspace = agent.workspace || config?.agents?.defaults?.workspace || process.env.OPENCLAW_WORKSPACE || join(process.env.OPENCLAW_DIR || join(homedir(), ".openclaw") || "/root/.openclaw", "workspace");
      const info = {
        name: agent.id === "main" ? (process.env.NEXT_PUBLIC_AGENT_NAME || "Mara") : (agent.name || agent.id),
        emoji: agent?.ui?.emoji || "🤖",
        color: agent?.ui?.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      };

      const status = getAgentStatusFromFiles(resolvedWorkspace);

      return {
        id: agent.id,
        name: info.name,
        emoji: info.emoji,
        color: info.color,
        role: agent.id === "main" ? "Main Agent" : "Sub-agent",
        currentTask: status.currentTask,
        isActive: status.isActive,
      };
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error getting office data:", error);
    return NextResponse.json({ error: "Failed to load office data" }, { status: 500 });
  }
}
