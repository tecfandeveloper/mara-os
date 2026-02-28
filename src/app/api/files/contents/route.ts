import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getWorkspaceBase } from "@/lib/paths";

const TEXT_EXT = new Set([
  "md", "txt", "json", "yaml", "yml", "ts", "tsx", "js", "jsx", "py", "rs",
  "go", "java", "c", "cpp", "h", "html", "css", "scss", "sh", "sql", "xml",
]);

function isTextPath(relativePath: string): boolean {
  const ext = relativePath.includes(".") ? relativePath.split(".").pop()?.toLowerCase() : "";
  return !!ext && TEXT_EXT.has(ext);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get("workspace") || "workspace";
  const filePath = searchParams.get("path");

  if (!filePath || typeof filePath !== "string") {
    return NextResponse.json(
      { error: "Missing path" },
      { status: 400 }
    );
  }

  const basePath = getWorkspaceBase(workspace);
  if (!basePath) {
    return NextResponse.json(
      { error: "Invalid workspace" },
      { status: 400 }
    );
  }

  const normalized = path.normalize(filePath).replace(/^\.\//, "");
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return NextResponse.json(
      { error: "Invalid path" },
      { status: 400 }
    );
  }

  const fullPath = path.join(basePath, normalized);
  const resolvedBase = path.resolve(basePath);
  const resolvedFull = path.resolve(fullPath);
  if (!resolvedFull.startsWith(resolvedBase)) {
    return NextResponse.json(
      { error: "Invalid path" },
      { status: 400 }
    );
  }

  let stat: { isFile: () => boolean };
  try {
    stat = await fs.stat(fullPath);
  } catch {
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }

  if (!stat.isFile()) {
    return NextResponse.json(
      { error: "Not a file" },
      { status: 400 }
    );
  }

  if (!isTextPath(normalized)) {
    return NextResponse.json(
      { error: "Preview not available for this file type", binary: true },
      { status: 200 }
    );
  }

  try {
    const content = await fs.readFile(fullPath, "utf-8");
    return NextResponse.json({ path: normalized, content });
  } catch {
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}
