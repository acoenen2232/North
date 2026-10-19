import { all } from "@/lib/db";

export type EventRow = {
  id: number;
  title: string;
  date: string;
  start_min: number | null;
  end_min: number | null;
  category: string;
  notes: string | null;
  repeat: "none" | "daily" | "weekdays" | "weekly";
  repeat_until: string | null;
  source: "me" | "vera";
  star_id: number | null;
  done: number;
};

/** Every event that lands on `date`, repeats expanded, skips removed. Timed first, then anytime. */
export function eventsOn(date: string): EventRow[] {
  return all<EventRow>(
    `SELECT e.*, EXISTS (SELECT 1 FROM event_done d WHERE d.event_id = e.id AND d.date = ?1) AS done
     FROM events e
     WHERE NOT EXISTS (SELECT 1 FROM event_skips s WHERE s.event_id = e.id AND s.date = ?1)
       AND (
         (e.repeat = 'none' AND e.date = ?1)
         OR (e.repeat <> 'none' AND e.date <= ?1 AND (e.repeat_until IS NULL OR e.repeat_until >= ?1) AND (
              e.repeat = 'daily'
           OR (e.repeat = 'weekdays' AND CAST(strftime('%w', ?1) AS INTEGER) BETWEEN 1 AND 5)
           OR (e.repeat = 'weekly' AND strftime('%w', ?1) = strftime('%w', e.date))
         ))
       )
     ORDER BY e.start_min IS NULL, e.start_min, e.id`,
    date,
  );
}

/** Category counts per day, for calendar dots. */
export function eventDots(dates: string[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const d of dates) out.set(d, eventsOn(d).map((e) => e.category));
  return out;
}

/** Minutes per category in a date range (timed events only). Used by Vera and, later, Spark. */
export function minutesByCategory(dates: string[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const d of dates) {
    for (const e of eventsOn(d)) {
      if (e.start_min === null || e.end_min === null) continue;
      totals[e.category] = (totals[e.category] ?? 0) + Math.max(0, e.end_min - e.start_min);
    }
  }
  return totals;
}
