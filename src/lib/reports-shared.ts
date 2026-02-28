/**
 * Persistence for shareable reports (read-only links).
 * SQLite data/shared-reports.db
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "shared-reports.db");

const DEFAULT_EXPIRY_DAYS = 30;

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
    CREATE TABLE IF NOT EXISTS shared_reports (
      token TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);
  return _db;
}

export interface SharedReportPayload {
  startDate: string;
  endDate: string;
  generatedAt: string;
  activity: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    successRate: number;
  };
  cost: {
    total: number;
    byModel: Array<{ model: string; cost: number; percentOfTotal: number }>;
    daily: Array<{ date: string; cost: number; input: number; output: number }>;
  };
}

export function saveReport(
  token: string,
  payload: SharedReportPayload,
  expiresInDays: number = DEFAULT_EXPIRY_DAYS
): { expiresAt: string } {
  const db = getDb();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    "INSERT INTO shared_reports (token, payload, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).run(token, JSON.stringify(payload), now, expiresAt);
  return { expiresAt };
}

export function getReport(token: string): SharedReportPayload | null {
  try {
    const db = getDb();
    const row = db.prepare(
      "SELECT payload, expires_at FROM shared_reports WHERE token = ?"
    ).get(token) as { payload: string; expires_at: string } | undefined;
    if (!row) return null;
    const expiresAt = new Date(row.expires_at).getTime();
    if (Date.now() > expiresAt) return null;
    return JSON.parse(row.payload) as SharedReportPayload;
  } catch {
    return null;
  }
}
