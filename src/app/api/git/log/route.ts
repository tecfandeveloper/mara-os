/**
 * Git log for a single file
 * GET /api/git/log?workspace=<id>&path=<filePath>
 */
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { getWorkspaceBase } from "@/lib/paths";

const execAsync = promisify(exec);

export interface GitLogEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get("workspace") || "workspace";
  const filePath = searchParams.get("path") || "";

  if (!filePath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const base = getWorkspaceBase(workspace);
  if (!base) {
    return NextResponse.json({ error: "Unknown workspace" }, { status: 400 });
  }

  const fullPath = path.join(base, filePath);
  if (!fullPath.startsWith(path.resolve(base))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const relativePath = path.relative(base, fullPath);
  const escapedPath = relativePath.replace(/"/g, '\\"');

  try {
    const { stdout } = await execAsync(
      `cd "${base}" && git log -n 20 --format="%H|%s|%an|%ar" -- "${escapedPath}" 2>/dev/null`
    );
    const lines = stdout.trim().split("\n").filter(Boolean);
    const entries: GitLogEntry[] = lines.map((line) => {
      const parts = line.split("|");
      return {
        hash: (parts[0] || "").slice(0, 8),
        message: parts[1] || "",
        author: parts[2] || "",
        date: parts[3] || "",
      };
    });
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}
