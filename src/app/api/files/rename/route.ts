/**
 * Rename (or move) a file within the memory/ and root .md scope.
 * POST /api/files/rename
 * Body: { workspace, path, newPath }
 */
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getWorkspaceBase } from "@/lib/paths";

const ROOT_FILES = ["MEMORY.md", "SOUL.md", "USER.md", "AGENTS.md", "TOOLS.md", "IDENTITY.md"];
const MEMORY_DIR = "memory";

function sanitizePath(requestedPath: string): string | null {
  const normalized = path.normalize(requestedPath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) return null;
  if (!normalized.endsWith(".md")) return null;
  const isRootFile = ROOT_FILES.includes(normalized);
  const isMemoryFile = normalized.startsWith(`${MEMORY_DIR}/`);
  if (!isRootFile && !isMemoryFile) return null;
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace, path: filePath, newPath } = body;

    if (!filePath || !newPath) {
      return NextResponse.json({ error: "Missing path or newPath" }, { status: 400 });
    }

    const base = getWorkspaceBase(workspace || "workspace");
    if (!base) {
      return NextResponse.json({ error: "Unknown workspace" }, { status: 400 });
    }

    const safePath = sanitizePath(filePath);
    const safeNewPath = sanitizePath(newPath);
    if (!safePath || !safeNewPath) {
      return NextResponse.json({ error: "Invalid path or newPath" }, { status: 400 });
    }

    const fullPath = path.join(base, safePath);
    const fullNewPath = path.join(base, safeNewPath);

    if (fullNewPath.startsWith(fullPath) && fullPath !== fullNewPath) {
      return NextResponse.json({ error: "Cannot move directory into itself" }, { status: 400 });
    }

    await fs.access(fullPath);
    await fs.mkdir(path.dirname(fullNewPath), { recursive: true });
    await fs.rename(fullPath, fullNewPath);

    return NextResponse.json({ success: true, path: safeNewPath });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    console.error("[rename] Error:", err);
    return NextResponse.json({ error: "Rename failed" }, { status: 500 });
  }
}
