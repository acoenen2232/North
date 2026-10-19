import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { modules } from "@/modules/registry";

// One connection per server process. Kept on globalThis so dev hot-reloads
// don't open a new handle on every edit.
const g = globalThis as unknown as { __northDb?: DatabaseSync };

export function dbPath(): string {
  return process.env.NORTH_DB_PATH ?? path.join(process.cwd(), "data", "north.db");
}

export function db(): DatabaseSync {
  if (!g.__northDb) {
    const file = dbPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const conn = new DatabaseSync(file);
    conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    migrate(conn);
    g.__northDb = conn;
  }
  return g.__northDb;
}

// Each module owns its tables. Migration ids are "<module>:<nnn>" and run once, in order.
function migrate(conn: DatabaseSync) {
  conn.exec(
    "CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))",
  );
  const applied = new Set(
    (conn.prepare("SELECT id FROM _migrations").all() as { id: string }[]).map((r) => r.id),
  );
  for (const mod of modules) {
    for (const m of mod.migrations) {
      const id = `${mod.id}:${m.id}`;
      if (applied.has(id)) continue;
      conn.exec("BEGIN");
      try {
        conn.exec(m.sql);
        conn.prepare("INSERT INTO _migrations (id) VALUES (?)").run(id);
        conn.exec("COMMIT");
      } catch (err) {
        conn.exec("ROLLBACK");
        throw new Error(`Migration ${id} failed: ${(err as Error).message}`);
      }
    }
  }
}

// node:sqlite returns null-prototype rows, which React can't pass to Client Components. Copy into plain objects.
export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return db()
    .prepare(sql)
    .all(...params)
    .map((r) => ({ ...r })) as T[];
}

export function get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  const row = db().prepare(sql).get(...params);
  return row ? ({ ...row } as T) : undefined;
}

export function run(sql: string, ...params: SQLInputValue[]) {
  return db().prepare(sql).run(...params);
}

export function tx<T>(fn: () => T): T {
  const conn = db();
  conn.exec("BEGIN");
  try {
    const out = fn();
    conn.exec("COMMIT");
    return out;
  } catch (err) {
    conn.exec("ROLLBACK");
    throw err;
  }
}
