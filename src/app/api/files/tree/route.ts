import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getWorkspaceBase } from "@/lib/paths";

const MAX_DEPTH = 8;
const SKIP_DIRS = new Set(["node_modules", ".git", "__pycache__", ".next"]);

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

function getCategory(ext: string, name: string): string {
  if (!name || name.endsWith("/")) return "folder";
  const code = new Set(["ts", "tsx", "js", "jsx", "py", "rs", "go", "java", "c", "cpp", "h", "json", "yaml", "yml", "md", "html", "css", "scss"]);
  const image = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"]);
  if (code.has(ext)) return "code";
  if (image.has(ext)) return "image";
  return "file";
}

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  extension?: string;
  category?: string;
  children?: TreeNode[];
}

async function buildTree(
  basePath: string,
  relativePath: string,
  depth: number
): Promise<TreeNode[]> {
  if (depth >= MAX_DEPTH) return [];
  const fullPath = path.join(basePath, relativePath);
  let entries: { name: string; isDirectory: boolean; size?: number }[];
  try {
    const raw = await fs.readdir(fullPath, { withFileTypes: true });
    entries = raw
      .filter((e) => !e.name.startsWith(".") && !SKIP_DIRS.has(e.name))
      .map((e) => ({
        name: e.name,
        isDirectory: e.isDirectory(),
        size: e.isFile() ? undefined : undefined,
      }));
    for (let i = 0; i < raw.length; i++) {
      const e = raw[i]!;
      if (e.isFile()) {
        try {
          const st = await fs.stat(path.join(fullPath, e.name));
          const entry = entries.find((x) => x.name === e.name);
          if (entry) entry.size = st.size;
        } catch {
          // ignore
        }
      }
    }
  } catch {
    return [];
  }

  const nodes: TreeNode[] = [];
  for (const e of entries) {
    const rel = relativePath ? `${relativePath}/${e.name}` : e.name;
    if (e.isDirectory) {
      const children = await buildTree(basePath, rel, depth + 1);
      nodes.push({
        name: e.name,
        path: rel,
        type: "folder",
        category: "folder",
        children,
      });
    } else {
      const ext = getExtension(e.name);
      nodes.push({
        name: e.name,
        path: rel,
        type: "file",
        size: e.size ?? 0,
        extension: ext || undefined,
        category: getCategory(ext, e.name),
      });
    }
  }
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get("workspace") || "workspace";

  const basePath = getWorkspaceBase(workspace);
  if (!basePath) {
    return NextResponse.json(
      { error: "Invalid workspace" },
      { status: 400 }
    );
  }

  let exists = false;
  try {
    const st = await fs.stat(basePath);
    exists = st.isDirectory();
  } catch {
    // not found
  }
  if (!exists) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    );
  }

  const tree = await buildTree(basePath, "", 0);
  return NextResponse.json({ workspace, tree });
}
