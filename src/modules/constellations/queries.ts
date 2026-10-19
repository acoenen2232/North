import { all } from "@/lib/db";
import { addDays, weekStart } from "@/lib/dates";

export type Habit = {
  id: number;
  name: string;
  kind: "good" | "bad";
  per_week: number;
  description: string | null;
  archived: number;
  sort: number;
  created_at: string;
};

export type HabitLog = {
  id: number;
  habit_id: number;
  date: string;
  logged_at: string;
  went_right: string | null;
  place: string | null;
  mood: string | null;
  people: string | null;
  note: string | null;
};

export const triggerChoices = {
  place: ["Home", "Work", "Car", "Out", "Bed"],
  mood: ["Stressed", "Bored", "Tired", "Anxious", "Lonely", "Happy"],
  people: ["Alone", "Partner", "Friends", "Coworkers", "Family"],
} as const;

export function habits(): Habit[] {
  return all<Habit>("SELECT * FROM habits WHERE archived = 0 ORDER BY kind DESC, sort, id");
}

export function logsBetween(from: string, to: string): HabitLog[] {
  return all<HabitLog>("SELECT * FROM habit_logs WHERE date BETWEEN ? AND ? ORDER BY logged_at", from, to);
}

export type HabitWeek = {
  habit: Habit;
  week: { date: string; done: boolean }[];
  count: number;
  doneToday: boolean;
  todayLogId: number | null;
  streak: number; // consecutive days up to today (or yesterday if not yet today)
};

export function habitWeeks(today: string): HabitWeek[] {
  const ws = weekStart(today);
  const from = addDays(today, -60);
  const logs = logsBetween(from < ws ? from : ws, addDays(ws, 6));
  return habits()
    .filter((h) => h.kind === "good")
    .map((habit) => {
      const mine = logs.filter((l) => l.habit_id === habit.id);
      const dates = new Set(mine.map((l) => l.date));
      const week = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(ws, i);
        return { date, done: dates.has(date) };
      });
      let streak = 0;
      let d = dates.has(today) ? today : addDays(today, -1);
      while (dates.has(d)) {
        streak++;
        d = addDays(d, -1);
      }
      const todayLog = mine.filter((l) => l.date === today).at(-1);
      return {
        habit,
        week,
        count: week.filter((w) => w.done).length,
        doneToday: dates.has(today),
        todayLogId: todayLog?.id ?? null,
        streak,
      };
    });
}

/** Recent "what went right" notes. These are the clues for fixing bad habits. */
export function wentRight(limit = 8): (HabitLog & { name: string })[] {
  return all<HabitLog & { name: string }>(
    `SELECT l.*, h.name FROM habit_logs l JOIN habits h ON h.id = l.habit_id
     WHERE l.went_right IS NOT NULL AND l.went_right <> '' ORDER BY l.logged_at DESC LIMIT ?`,
    limit,
  );
}

const hourBucket = (ts: string) => {
  const h = new Date(ts).getHours();
  return h < 5 ? "Late night" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : h < 21 ? "Evening" : "Night";
};

export type TriggerStats = {
  habit: Habit;
  total: number;
  last30: number;
  top: { kind: "When" | "Where" | "Feeling" | "With"; value: string; count: number }[];
};

export function triggerStats(today: string): TriggerStats[] {
  const logs = logsBetween(addDays(today, -90), today);
  return habits()
    .filter((h) => h.kind === "bad")
    .map((habit) => {
      const mine = logs.filter((l) => l.habit_id === habit.id);
      const tally = (kind: TriggerStats["top"][number]["kind"], vals: (string | null)[]) => {
        const counts = new Map<string, number>();
        for (const v of vals) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
        return [...counts].map(([value, count]) => ({ kind, value, count }));
      };
      const top = [
        ...tally("When", mine.map((l) => hourBucket(l.logged_at))),
        ...tally("Where", mine.map((l) => l.place)),
        ...tally("Feeling", mine.map((l) => l.mood)),
        ...tally("With", mine.map((l) => l.people)),
      ]
        .filter((t) => t.count >= 2 || mine.length < 4)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
      return {
        habit,
        total: mine.length,
        last30: mine.filter((l) => l.date >= addDays(today, -29)).length,
        top,
      };
    });
}
