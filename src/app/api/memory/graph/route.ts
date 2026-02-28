/**
 * Knowledge graph from MEMORY.md and memory/*.md
 * GET /api/memory/graph?workspace=<id>&q=<search filter>
 */
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getWorkspaceBase } from "@/lib/paths";

interface GraphNode {
  id: string;
  label: string;
  type: "heading" | "term";
  file: string;
  snippet: string;
  section?: string;
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  weight: number;
}

async function getMemoryFiles(workspacePath: string): Promise<Array<{ path: string; display: string }>> {
  const files: Array<{ path: string; display: string }> = [];
  const rootFiles = ["MEMORY.md", "SOUL.md", "USER.md", "AGENTS.md", "TOOLS.md", "IDENTITY.md", "HEARTBEAT.md"];
  for (const f of rootFiles) {
    const full = path.join(workspacePath, f);
    try {
      await fs.access(full);
      files.push({ path: full, display: f });
    } catch {}
  }
  try {
    const memDir = path.join(workspacePath, "memory");
    const memFiles = await fs.readdir(memDir);
    for (const f of memFiles.sort().reverse().slice(0, 50)) {
      if (f.endsWith(".md")) {
        files.push({ path: path.join(memDir, f), display: `memory/${f}` });
      }
    }
  } catch {}
  return files;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractNodesAndEdges(
  content: string,
  fileDisplay: string
): { nodes: GraphNode[]; edges: Array<{ from: string; to: string }> } {
  const nodes: GraphNode[] = [];
  const edges: Array<{ from: string; to: string }> = [];
  const lines = content.split("\n");
  let currentSection: string | null = null;
  const sectionNodes: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const label = headingMatch[2].trim();
      if (label.length < 2) continue;
      const id = `${fileDisplay}:${slugify(label)}:${i}`;
      const snippet = line + (lines[i + 1] ? " " + lines[i + 1].trim().slice(0, 80) : "");
      nodes.push({
        id,
        label,
        type: "heading",
        file: fileDisplay,
        snippet: snippet.slice(0, 200),
        section: currentSection ?? undefined,
      });
      if (level === 1) {
        currentSection = id;
        sectionNodes.length = 0;
      }
      sectionNodes.push(id);
      for (let j = 0; j < sectionNodes.length - 1; j++) {
        edges.push({ from: sectionNodes[j], to: id });
      }
      continue;
    }

    const boldMatch = line.match(/\*\*([^*]+)\*\*/g);
    if (boldMatch) {
      boldMatch.forEach((m) => {
        const label = m.replace(/\*\*/g, "").trim();
        if (label.length < 2 || label.length > 40) return;
        const id = `${fileDisplay}:term:${slugify(label)}:${i}`;
        if (nodes.some((n) => n.id === id)) return;
        const snippet = line.replace(/\n+/g, " ").slice(0, 200);
        nodes.push({
          id,
          label,
          type: "term",
          file: fileDisplay,
          snippet,
          section: currentSection ?? undefined,
        });
        if (currentSection) {
          edges.push({ from: currentSection, to: id });
        }
        sectionNodes.forEach((sid) => {
          if (sid !== id) edges.push({ from: sid, to: id });
        });
      });
    }
  }

  return { nodes, edges };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get("workspace")?.trim() || "workspace";
  const q = searchParams.get("q")?.trim()?.toLowerCase() || "";

  const workspacePath = getWorkspaceBase(workspace);
  if (!workspacePath) {
    return NextResponse.json({ nodes: [], edges: [] });
  }

  try {
    const fileList = await getMemoryFiles(workspacePath);
    const allNodes: GraphNode[] = [];
    const allEdges: Array<{ from: string; to: string }> = [];

    for (const { path: filePath, display: fileDisplay } of fileList) {
      const content = await fs.readFile(filePath, "utf-8");
      const { nodes, edges } = extractNodesAndEdges(content, fileDisplay);
      allNodes.push(...nodes);
      allEdges.push(...edges);
    }

    let filteredNodes = allNodes;
    if (q.length >= 2) {
      filteredNodes = allNodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.snippet.toLowerCase().includes(q) ||
          (n.section && allNodes.find((x) => x.id === n.section)?.label.toLowerCase().includes(q))
      );
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const edges: GraphEdge[] = [];
    const edgeCount = new Map<string, number>();
    allEdges.forEach((e) => {
      if (nodeIds.has(e.from) && nodeIds.has(e.to) && e.from !== e.to) {
        const key = `${e.from}\t${e.to}`;
        edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
      }
    });
    edgeCount.forEach((weight, key) => {
      const [sourceId, targetId] = key.split("\t");
      edges.push({ sourceId, targetId, weight });
    });

    return NextResponse.json({
      nodes: filteredNodes,
      edges,
    });
  } catch (error) {
    console.error("[memory/graph] Error:", error);
    return NextResponse.json({ error: "Graph failed" }, { status: 500 });
  }
}
