import type { ModuleSchema } from "../registry";

export const morning: ModuleSchema = {
  id: "morning",
  name: "Morning mode",
  migrations: [
    {
      id: "001",
      sql: `
        CREATE TABLE morning_tasks (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          sort INTEGER NOT NULL DEFAULT 0,
          active INTEGER NOT NULL DEFAULT 1
        );
        INSERT INTO morning_tasks (name, sort) VALUES
          ('Let the dog out', 1), ('Make breakfast', 2), ('Get ready', 3);

        -- One row per morning. Timestamps are ISO strings.
        CREATE TABLE morning_days (
          date TEXT PRIMARY KEY,
          woke_at TEXT,
          left_at TEXT,
          arrived_at TEXT,
          note TEXT
        );

        -- Tap start/stop on a task.
        CREATE TABLE morning_segments (
          id INTEGER PRIMARY KEY,
          date TEXT NOT NULL,
          task_id INTEGER NOT NULL REFERENCES morning_tasks(id),
          started_at TEXT NOT NULL,
          ended_at TEXT
        );
        CREATE INDEX morning_segments_date ON morning_segments(date);

        -- Evening prep checklist. "date" is the evening it was done.
        CREATE TABLE prep_items (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          sort INTEGER NOT NULL DEFAULT 0,
          active INTEGER NOT NULL DEFAULT 1
        );
        INSERT INTO prep_items (name, sort) VALUES
          ('Pick tomorrow''s outfit', 1), ('Prep breakfast', 2), ('Pack bag', 3);

        CREATE TABLE prep_checks (
          date TEXT NOT NULL,
          item_id INTEGER NOT NULL REFERENCES prep_items(id),
          checked_at TEXT NOT NULL,
          PRIMARY KEY (date, item_id)
        );
      `,
    },
  ],
};
