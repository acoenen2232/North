import type { ModuleSchema } from "../registry";

export const checkin: ModuleSchema = {
  id: "checkin",
  name: "Daily check-in",
  migrations: [
    {
      id: "001",
      sql: `
        CREATE TABLE checkins (
          date TEXT PRIMARY KEY,
          mood INTEGER,            -- 1..5
          energy INTEGER,          -- 1..5
          sleep_hours REAL,
          sleep_quality INTEGER,   -- 1..5
          note TEXT,
          updated_at TEXT NOT NULL
        );
      `,
    },
  ],
};
