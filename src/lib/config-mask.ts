/**
 * Mask secret values in OpenClaw config for safe API responses.
 * Keys matching these (case-insensitive) or containing these substrings are redacted.
 */
const SECRET_KEYS = [
  'token',
  'password',
  'api_key',
  'apiKey',
  'secret',
  'auth',
  'credentials',
  'private',
];

const REDACTED = '[REDACTED]';

function isSecretKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SECRET_KEYS.some((k) => lower === k || lower.includes(k));
}

/**
 * Recursively mask secret values in an object. Modifies in place and returns the same object.
 */
export function maskSecrets(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSecrets(item));
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (isSecretKey(key)) {
      record[key] = REDACTED;
    } else {
      record[key] = maskSecrets(record[key]);
    }
  }
  return record;
}
