/**
 * Persistence for suggestion dismissals (Smart Suggestions).
 * SQLite in data/suggestions.db.
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "suggestions.db");

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
    CREATE TABLE IF NOT EXISTS dismissals (
      suggestion_id TEXT PRIMARY KEY,
      dismissed_at TEXT NOT NULL,
      applied INTEGER NOT NULL DEFAULT 0
    );
  `);
  return _db;
}

export function getDismissedIds(): Set<string> {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT suggestion_id FROM dismissals").all() as Array<{ suggestion_id: string }>;
    return new Set(rows.map((r) => r.suggestion_id));
  } catch {
    return new Set();
  }
}

export function recordDismissal(suggestionId: string, applied: boolean): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO dismissals (suggestion_id, dismissed_at, applied) VALUES (?, ?, ?) ON CONFLICT(suggestion_id) DO UPDATE SET dismissed_at = ?, applied = ?"
  ).run(suggestionId, now, applied ? 1 : 0, now, applied ? 1 : 0);
}
