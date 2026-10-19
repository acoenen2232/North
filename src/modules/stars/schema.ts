import type { ModuleSchema } from "../registry";

export const stars: ModuleSchema = {
  id: "stars",
  name: "Stars",
  migrations: [
    {
      id: "001",
      sql: `
        CREATE TABLE stars (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('goal', 'todo')),
          goal_id INTEGER REFERENCES stars(id) ON DELETE SET NULL,
          why TEXT,
          due_date TEXT,
          planned_date TEXT,
          status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'dropped')),
          created_at TEXT NOT NULL,
          done_at TEXT
        );

        -- "Why am I putting this off?" Each row is one stuck moment, the fix tried, and whether it helped.
        CREATE TABLE stuck_logs (
          id INTEGER PRIMARY KEY,
          star_id INTEGER NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
          reason TEXT NOT NULL,
          fix TEXT NOT NULL,
          created_at TEXT NOT NULL,
          outcome TEXT CHECK (outcome IN ('helped', 'didnt')),
          resolved_at TEXT
        );
      `,
    },
  ],
};
