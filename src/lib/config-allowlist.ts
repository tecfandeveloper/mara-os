/**
 * Allowlist of OpenClaw config paths that are safe to edit from Mission Control.
 * Sensitive keys (tokens, credentials) are never allowed.
 */
export const CONFIG_ALLOWLIST: Array<{
  path: string;
  type: 'string' | 'number' | 'boolean';
  min?: number;
  max?: number;
  enum?: string[];
}> = [
  { path: 'model', type: 'string' },
  { path: 'gateway.port', type: 'number', min: 1, max: 65535 },
  { path: 'gateway.enabled', type: 'boolean' },
  { path: 'log.level', type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
  { path: 'agents.defaults.model', type: 'string' },
];

const ALLOWED_PATHS = new Set(CONFIG_ALLOWLIST.map((e) => e.path));

export function isPathAllowed(path: string): boolean {
  return ALLOWED_PATHS.has(path);
}

export function getSchema(path: string) {
  return CONFIG_ALLOWLIST.find((e) => e.path === path);
}

export function validateValue(path: string, value: unknown): { ok: boolean; error?: string } {
  const schema = getSchema(path);
  if (!schema) return { ok: false, error: 'Path not allowed' };

  if (schema.type === 'string') {
    if (typeof value !== 'string') return { ok: false, error: 'Must be a string' };
    if (schema.enum && !schema.enum.includes(value)) {
      return { ok: false, error: `Must be one of: ${schema.enum.join(', ')}` };
    }
    return { ok: true };
  }

  if (schema.type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { ok: false, error: 'Must be a number' };
    }
    if (schema.min != null && value < schema.min) {
      return { ok: false, error: `Must be >= ${schema.min}` };
    }
    if (schema.max != null && value > schema.max) {
      return { ok: false, error: `Must be <= ${schema.max}` };
    }
    return { ok: true };
  }

  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') return { ok: false, error: 'Must be true or false' };
    return { ok: true };
  }

  return { ok: false, error: 'Unknown type' };
}

/** Get a value at a dot path. Returns undefined if path missing. */
export function getAtPath(obj: unknown, keyPath: string): unknown {
  if (obj == null || typeof obj !== 'object') return undefined;
  const parts = keyPath.split('.');
  let current: unknown = obj;
  for (const key of parts) {
    if (current == null || typeof current !== 'object' || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Set a value at a dot path in an object (mutates obj). */
export function setAtPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = current[key];
    if (next === null || next === undefined || typeof next !== 'object' || Array.isArray(next)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  current[last] = value;
}

/** Paths that affect gateway and should recommend restart */
const GATEWAY_PATHS_PREFIX = 'gateway.';
export function affectsGateway(path: string): boolean {
  return path === 'gateway' || path.startsWith(GATEWAY_PATHS_PREFIX);
}
