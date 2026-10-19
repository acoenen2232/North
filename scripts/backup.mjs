// Manual backup: `npm run backup`. The server also does this nightly at 2 AM.
// Copies the database to NORTH_BACKUP_DIR (from .env.local) and keeps the newest 30.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

const src = process.env.NORTH_DB_PATH ?? path.join("data", "north.db");
const dir = process.env.NORTH_BACKUP_DIR;
if (!dir) {
  console.error("Set NORTH_BACKUP_DIR in .env.local first (for example E:\\NorthBackups).");
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error(`No database at ${src} yet. Open North once first.`);
  process.exit(1);
}

fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const file = path.join(dir, `north-${stamp}.db`);
new DatabaseSync(src).prepare("VACUUM INTO ?").run(file);

const old = fs.readdirSync(dir).filter((f) => /^north-.*\.db$/.test(f)).sort().reverse().slice(30);
for (const f of old) fs.rmSync(path.join(dir, f));
console.log(`Backed up to ${file}`);
