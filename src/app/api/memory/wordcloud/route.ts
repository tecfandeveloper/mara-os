/**
 * Word cloud data from MEMORY.md and memory/*.md
 * GET /api/memory/wordcloud?workspace=<id>&file=<optional limit to one file>
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getWorkspaceBase } from '@/lib/paths';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'way', 'who', 'did', 'get', 'got', 'let', 'put', 'say', 'she', 'too', 'use',
  'de', 'la', 'el', 'en', 'un', 'una', 'los', 'las', 'del', 'por', 'con', 'que', 'para', 'al', 'lo', 'como', 'pero', 'sus', 'le', 'ya', 'o', 'fue', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'tambien', 'me', 'hasta', 'hay', 'donde', 'han', 'quien', 'desde', 'todo', 'nos', 'durante', 'estados', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mi', 'antes', 'algunos', 'que', 'unos', 'yo', 'otro', 'otra', 'ser', 'es', 'son', 'era', 'eran', 'fue', 'fueron', 'sera', 'esta', 'estan', 'estaba', 'estaban', 'si', 'no', 'a', 'i', 'o', 'u',
]);

async function getMemoryFiles(workspacePath: string, limitToFile?: string): Promise<Array<{ path: string; display: string }>> {
  const files: Array<{ path: string; display: string }> = [];

  const rootFiles = ['MEMORY.md', 'SOUL.md', 'USER.md', 'AGENTS.md', 'TOOLS.md', 'IDENTITY.md', 'HEARTBEAT.md'];
  for (const f of rootFiles) {
    if (limitToFile && limitToFile !== f) continue;
    const full = path.join(workspacePath, f);
    try {
      await fs.access(full);
      files.push({ path: full, display: f });
    } catch {}
  }

  if (!limitToFile || limitToFile.startsWith('memory/')) {
    try {
      const memDir = path.join(workspacePath, 'memory');
      const memFiles = await fs.readdir(memDir);
      for (const f of memFiles.sort().reverse().slice(0, 30)) {
        if (f.endsWith('.md')) {
          const display = `memory/${f}`;
          if (limitToFile && limitToFile !== display) continue;
          files.push({ path: path.join(memDir, f), display });
        }
      }
    } catch {}
  }

  return files;
}

function stripMarkdown(content: string): string {
  return content
    .replace(/^#+\s+.+$/gm, ' ')
    .replace(/\*\*([^*]+)\*\*/g, ' $1 ')
    .replace(/\*([^*]+)\*/g, ' $1 ')
    .replace(/__([^_]+)__/g, ' $1 ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/[#*_`\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function tokenize(text: string): string[] {
  const words = text.split(/[^a-z0-9\u00C0-\u024F]+/i).filter(Boolean);
  return words.filter((w) => {
    const lower = w.toLowerCase();
    if (lower.length < 2) return false;
    if (STOPWORDS.has(lower)) return false;
    if (/^\d+$/.test(lower)) return false;
    return true;
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get('workspace')?.trim() || 'workspace';
  const file = searchParams.get('file')?.trim() || undefined;
  const limit = Math.min(200, Math.max(50, parseInt(searchParams.get('limit') || '120', 10)));

  const workspacePath = getWorkspaceBase(workspace);
  if (!workspacePath) {
    return NextResponse.json({ words: [], maxCount: 0 });
  }

  try {
    const fileList = await getMemoryFiles(workspacePath, file);
    const countMap = new Map<string, number>();

    for (const { path: filePath, display: displayPath } of fileList) {
      const content = await fs.readFile(filePath, 'utf-8');
      const plain = stripMarkdown(content);
      const tokens = tokenize(plain);
      for (const t of tokens) {
        countMap.set(t, (countMap.get(t) || 0) + 1);
      }
    }

    const words = Array.from(countMap.entries())
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    const maxCount = words[0]?.count ?? 0;

    return NextResponse.json({ words, maxCount });
  } catch (error) {
    console.error('[memory/wordcloud] Error:', error);
    return NextResponse.json({ error: 'Word cloud failed' }, { status: 500 });
  }
}
