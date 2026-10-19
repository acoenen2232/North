import type { ModuleSchema } from "../registry";

export const core: ModuleSchema = {
  id: "core",
  name: "Core",
  migrations: [
    {
      id: "001",
      sql: `CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );`,
    },
  ],
};
