import type { ModuleSchema } from "../registry";

export const push: ModuleSchema = {
  id: "push",
  name: "Reminders",
  migrations: [
    {
      id: "001",
      sql: `
        CREATE TABLE push_subscriptions (
          endpoint TEXT PRIMARY KEY,
          json TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        -- days: digits of the weekdays it fires on (0 = Sunday).
        -- kind 'leave_by' fires 10 min before the computed leave-by time (only once morning mode is in "improve").
        CREATE TABLE reminders (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          body TEXT,
          time TEXT NOT NULL,
          days TEXT NOT NULL DEFAULT '0123456',
          url TEXT NOT NULL DEFAULT '/',
          kind TEXT NOT NULL DEFAULT 'custom',
          active INTEGER NOT NULL DEFAULT 1,
          last_sent TEXT
        );
        INSERT INTO reminders (title, body, time, days, url, kind, active) VALUES
          ('Leave soon', 'Leave-by is in 10 minutes.', '00:00', '12345', '/morning', 'leave_by', 1),
          ('Evening dog walk', 'Brisk walk + 5 min stretch = today''s workout.', '18:30', '0123456', '/constellations', 'custom', 1),
          ('Evening prep', 'Outfit, breakfast, bag. Future you says thanks.', '20:30', '0123456', '/morning', 'custom', 1),
          ('Check in', 'Under a minute: mood, energy, sleep.', '21:00', '0123456', '/', 'custom', 1),
          ('Bearings', 'Your weekly review with Vera is ready when you are.', '18:00', '0', '/vera', 'custom', 1);
      `,
    },
  ],
};
