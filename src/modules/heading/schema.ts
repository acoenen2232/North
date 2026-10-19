import type { ModuleSchema } from "../registry";

export const heading: ModuleSchema = {
  id: "heading",
  name: "Today's Heading",
  migrations: [
    {
      id: "001",
      sql: `
        -- Built-in calendar. A time block or event; may repeat.
        CREATE TABLE events (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          date TEXT NOT NULL,              -- first (or only) occurrence
          start_min INTEGER,               -- minutes since midnight; NULL = anytime/all day
          end_min INTEGER,
          category TEXT NOT NULL DEFAULT 'block',
          notes TEXT,
          repeat TEXT NOT NULL DEFAULT 'none',   -- none | daily | weekdays | weekly
          repeat_until TEXT,
          source TEXT NOT NULL DEFAULT 'me',     -- me | vera
          star_id INTEGER,
          created_at TEXT NOT NULL
        );
        CREATE INDEX events_date ON events(date);

        -- "Skip just this one" for repeating events.
        CREATE TABLE event_skips (
          event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          PRIMARY KEY (event_id, date)
        );

        CREATE TABLE event_done (
          event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          PRIMARY KEY (event_id, date)
        );
      `,
    },
  ],
};
