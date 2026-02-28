/**
 * Persistence for Model Playground: experiments and shared links.
 * SQLite data/playground.db
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "playground.db");

const SHARED_EXPIRY_DAYS = 30;

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS playground_experiments (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      results TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS playground_shared (
      token TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (experiment_id) REFERENCES playground_experiments(id)
    );
  `);
  return _db;
}

export interface PlaygroundResult {
  modelId: string;
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  elapsedMs: number;
}

export interface PlaygroundExperiment {
  id: string;
  prompt: string;
  results: PlaygroundResult[];
  createdAt: string;
}

export function saveExperiment(
  id: string,
  prompt: string,
  results: PlaygroundResult[]
): PlaygroundExperiment {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO playground_experiments (id, prompt, results, created_at) VALUES (?, ?, ?, ?)"
  ).run(id, prompt, JSON.stringify(results), now);
  return { id, prompt, results, createdAt: now };
}

export function getExperiment(id: string): PlaygroundExperiment | null {
  try {
    const db = getDb();
    const row = db
      .prepare(
        "SELECT id, prompt, results, created_at FROM playground_experiments WHERE id = ?"
      )
      .get(id) as
      | { id: string; prompt: string; results: string; created_at: string }
      | undefined;
    if (!row) return null;
    return {
      id: row.id,
      prompt: row.prompt,
      results: JSON.parse(row.results) as PlaygroundResult[],
      createdAt: row.created_at,
    };
  } catch {
    return null;
  }
}

export function listExperiments(limit: number = 50): PlaygroundExperiment[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, prompt, results, created_at FROM playground_experiments ORDER BY created_at DESC LIMIT ?"
    )
    .all(limit) as Array<{
      id: string;
      prompt: string;
      results: string;
      created_at: string;
    }>;
  return rows.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    results: JSON.parse(row.results) as PlaygroundResult[],
    createdAt: row.created_at,
  }));
}

export function saveSharedToken(
  token: string,
  experimentId: string,
  expiresInDays: number = SHARED_EXPIRY_DAYS
): { expiresAt: string } {
  const db = getDb();
  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000
  ).toISOString();
  db.prepare(
    "INSERT INTO playground_shared (token, experiment_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).run(token, experimentId, now, expiresAt);
  return { expiresAt };
}

export function getSharedExperiment(token: string): PlaygroundExperiment | null {
  try {
    const db = getDb();
    const row = db
      .prepare(
        "SELECT experiment_id, expires_at FROM playground_shared WHERE token = ?"
      )
      .get(token) as { experiment_id: string; expires_at: string } | undefined;
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    return getExperiment(row.experiment_id);
  } catch {
    return null;
  }
}

export function generateId(): string {
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateToken(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}
