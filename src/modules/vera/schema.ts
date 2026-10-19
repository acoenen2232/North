import type { ModuleSchema } from "../registry";

export const vera: ModuleSchema = {
  id: "vera",
  name: "Vera",
  migrations: [
    {
      id: "001",
      sql: `
        -- True North: the living profile Vera reads before every plan and review.
        CREATE TABLE true_north (
          section TEXT PRIMARY KEY,
          content TEXT NOT NULL DEFAULT '',
          updated_at TEXT
        );
        INSERT INTO true_north (section) VALUES
          ('values'), ('patterns'), ('works'), ('doesnt_work'), ('notes');

        CREATE TABLE vera_plans (
          date TEXT PRIMARY KEY,
          content TEXT NOT NULL,      -- JSON
          model TEXT NOT NULL,
          created_at TEXT NOT NULL,
          accepted_at TEXT
        );

        CREATE TABLE bearings (
          week_start TEXT PRIMARY KEY,
          content TEXT NOT NULL,      -- JSON
          model TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        -- Every Claude API call, so spend is visible.
        CREATE TABLE vera_calls (
          id INTEGER PRIMARY KEY,
          kind TEXT NOT NULL,
          model TEXT NOT NULL,
          input_tokens INTEGER NOT NULL DEFAULT 0,
          output_tokens INTEGER NOT NULL DEFAULT 0,
          cache_read_tokens INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
      `,
    },
  ],
};
