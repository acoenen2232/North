import type { ModuleSchema } from "../registry";

export const constellations: ModuleSchema = {
  id: "constellations",
  name: "Constellations",
  migrations: [
    {
      id: "001",
      sql: `
        CREATE TABLE habits (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('good', 'bad')),
          per_week INTEGER NOT NULL DEFAULT 7,   -- target for good habits
          description TEXT,
          archived INTEGER NOT NULL DEFAULT 0,
          sort INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        INSERT INTO habits (name, kind, per_week, description, sort, created_at) VALUES
          ('Brisk dog walk', 'good', 7, '15–20 minutes, evenings to start', 1, datetime('now')),
          ('Stretch', 'good', 7, '5 minutes. Walk + stretch = minimum workout', 2, datetime('now')),
          ('Workout', 'good', 3, 'Anything beyond the minimum', 3, datetime('now')),
          ('Read', 'good', 5, NULL, 4, datetime('now'));

        -- Good habit: a "done" log, optionally with what went right.
        -- Bad habit: an occurrence with its triggers (time is logged_at; place, mood, people).
        CREATE TABLE habit_logs (
          id INTEGER PRIMARY KEY,
          habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          logged_at TEXT NOT NULL,
          went_right TEXT,
          place TEXT,
          mood TEXT,
          people TEXT,
          note TEXT
        );
        CREATE INDEX habit_logs_date ON habit_logs(date);
      `,
    },
  ],
};
