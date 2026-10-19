import fs from "node:fs";
import path from "node:path";
import { db } from "./db";
import { isoDate } from "./dates";

const KEEP = 30;

export function backupDir(): string | null {
  return process.env.NORTH_BACKUP_DIR || null;
}

// Paths here are runtime locations on the laptop (a USB drive), so the bundler is told not to trace them.
const join = (dir: string, file: string) => path.join(/*turbopackIgnore: true*/ dir, file);

/** Consistent snapshot of the database into NORTH_BACKUP_DIR, keeping the newest 30. */
export function backupNow(): string {
  const dir = backupDir();
  if (!dir) throw new Error("NORTH_BACKUP_DIR isn't set");
  fs.mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = join(dir, `north-${stamp}.db`);
  db().prepare("VACUUM INTO ?").run(file);
  const old = fs
    .readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => /^north-.*\.db$/.test(f))
    .sort()
    .reverse()
    .slice(KEEP);
  for (const f of old) fs.rmSync(join(dir, f));
  return file;
}

export function lastBackup(): { file: string; date: string } | null {
  const dir = backupDir();
  if (!dir || !fs.existsSync(/*turbopackIgnore: true*/ dir)) return null;
  const last = fs
    .readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => /^north-.*\.db$/.test(f))
    .sort()
    .at(-1);
  if (!last) return null;
  const file = join(dir, last);
  return { file, date: isoDate(fs.statSync(file).mtime) };
}
