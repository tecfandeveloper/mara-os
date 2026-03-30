import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";

type ColumnKey = "backlog" | "todo" | "doing" | "done";

type Card = {
  text: string;
  checked: boolean;
};

const COLUMN_MAP: Array<{ title: string; key: ColumnKey }> = [
  { title: "Backlog", key: "backlog" },
  { title: "Todo", key: "todo" },
  { title: "Doing", key: "doing" },
  { title: "Done", key: "done" },
];

function getVaultPath() {
  const p = join(homedir(), "Library/Application Support/obsidian/obsidian.json");
  if (!existsSync(p)) return null;
  const raw = JSON.parse(readFileSync(p, "utf-8"));
  const vaults = raw?.vaults || {};
  for (const value of Object.values(vaults) as any[]) {
    if (value?.open && value?.path) return value.path as string;
  }
  const first = Object.values(vaults)[0] as any;
  return first?.path || null;
}

function normalizeCardText(text: string) {
  return text
    .replace(/^>\s*\[!.*?\]\s*/i, "")
    .replace(/^\[\[|\]\]$/g, "")
    .trim();
}

function parseKanban(content: string) {
  const columns: Record<ColumnKey, Card[]> = {
    backlog: [],
    todo: [],
    doing: [],
    done: [],
  };

  let current: ColumnKey | null = null;
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      const title = heading[1].trim().toLowerCase();
      current = COLUMN_MAP.find((c) => c.title.toLowerCase() === title)?.key || null;
      continue;
    }

    const task = line.match(/^- \[( |x)\]\s+(.*)$/i);
    if (task && current) {
      columns[current].push({
        checked: task[1].toLowerCase() === "x",
        text: normalizeCardText(task[2]),
      });
      continue;
    }

    const pluginCard = line.match(/^-\s+(.*)$/);
    if (pluginCard && current && pluginCard[1].trim() && !pluginCard[1].trim().startsWith("%%")) {
      columns[current].push({
        checked: false,
        text: normalizeCardText(pluginCard[1]),
      });
    }
  }

  return columns;
}

export async function GET() {
  try {
    const vaultPath = getVaultPath();
    if (!vaultPath) {
      return NextResponse.json({ error: "Obsidian vault not found" }, { status: 404 });
    }

    const kanbanPath = join(vaultPath, "MaraOs", "SystemFiles", "Kanban-General.md");
    if (!existsSync(kanbanPath)) {
      return NextResponse.json({ error: "Kanban file not found", path: kanbanPath }, { status: 404 });
    }

    const content = readFileSync(kanbanPath, "utf-8");
    const columns = parseKanban(content);
    const counts = Object.fromEntries(Object.entries(columns).map(([k, v]) => [k, v.length]));

    return NextResponse.json({
      source: kanbanPath,
      columns,
      counts,
      format: content.includes("kanban-plugin: board") ? "obsidian-kanban-plugin" : "markdown",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[kanban] Error:", error);
    return NextResponse.json({ error: "Failed to load kanban" }, { status: 500 });
  }
}
