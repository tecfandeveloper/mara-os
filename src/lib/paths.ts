import path from 'path';

/**
 * Centralized path configuration.
 * In production (VPS), these default to /root/.openclaw paths.
 * For local development, override via environment variables.
 */
export const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/root/.openclaw';
export const OPENCLAW_WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(OPENCLAW_DIR, 'workspace');
export const OPENCLAW_CONFIG = path.join(OPENCLAW_DIR, 'openclaw.json');
export const OPENCLAW_MEDIA = path.join(OPENCLAW_DIR, 'media');

export const WORKSPACE_IDENTITY = path.join(OPENCLAW_WORKSPACE, 'IDENTITY.md');
export const WORKSPACE_TOOLS = path.join(OPENCLAW_WORKSPACE, 'TOOLS.md');
export const WORKSPACE_MEMORY = path.join(OPENCLAW_WORKSPACE, 'memory');

export const SYSTEM_SKILLS_PATH = '/usr/lib/node_modules/openclaw/skills';
export const WORKSPACE_SKILLS_PATH = path.join(OPENCLAW_DIR, 'workspace-infra', 'skills');

/** Allowed base paths for media/file serving */
export const ALLOWED_MEDIA_PREFIXES = [
  path.join(OPENCLAW_WORKSPACE, '/'),
  path.join(OPENCLAW_MEDIA, '/'),
];

/**
 * Resolve workspace id to absolute base path.
 * Accepts any single path segment (e.g. "workspace", "workspace-academic").
 * Returns null if workspace id is invalid (traversal, slashes).
 */
export function getWorkspaceBase(workspaceId: string): string | null {
  if (!workspaceId || typeof workspaceId !== 'string') return null;
  const trimmed = workspaceId.trim();
  if (trimmed.includes('..') || trimmed.includes('/') || path.isAbsolute(trimmed)) return null;
  const base = path.join(OPENCLAW_DIR, trimmed);
  const resolvedOpenClaw = path.resolve(OPENCLAW_DIR);
  const resolvedBase = path.resolve(base);
  if (!resolvedBase.startsWith(resolvedOpenClaw)) return null;
  return base;
}
