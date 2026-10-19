import { all, get } from "@/lib/db";
import { addDays, daysBetween, isoDate, minutesFromTimestamp, parseHHMM } from "@/lib/dates";
import { getSetting } from "@/modules/core/settings";

export type MorningTask = { id: number; name: string; sort: number; active: number };
export type Segment = { id: number; date: string; task_id: number; started_at: string; ended_at: string | null };
export type MorningDay = {
  date: string;
  woke_at: string | null;
  left_at: string | null;
  arrived_at: string | null;
  note: string | null;
};
export type PrepItem = { id: number; name: string; sort: number; active: number };

export function morningTasks(includeArchived = false): MorningTask[] {
  return all<MorningTask>(
    `SELECT * FROM morning_tasks ${includeArchived ? "" : "WHERE active = 1"} ORDER BY sort, id`,
  );
}

export function morningDay(date: string): { day: MorningDay | null; segments: Segment[] } {
  const day = get<MorningDay>("SELECT * FROM morning_days WHERE date = ?", date) ?? null;
  const segments = all<Segment>("SELECT * FROM morning_segments WHERE date = ? ORDER BY started_at", date);
  return { day, segments };
}

export function prepItems(includeArchived = false): PrepItem[] {
  return all<PrepItem>(`SELECT * FROM prep_items ${includeArchived ? "" : "WHERE active = 1"} ORDER BY sort, id`);
}

export function prepChecks(date: string): number[] {
  return all<{ item_id: number }>("SELECT item_id FROM prep_checks WHERE date = ?", date).map((r) => r.item_id);
}

/** Leave-by in minutes since midnight, from the goal arrival time and commute. */
export function leaveByMin(): number {
  const p = getSetting("profile");
  return parseHHMM(p.goalArrive) - p.commuteMin;
}

export function morningPhase() {
  const s = getSetting("morning");
  const started = s.phaseStarted || isoDate();
  const day = daysBetween(started, isoDate()) + 1;
  return { ...s, phaseStarted: started, day, readyToImprove: s.phase === "measure" && day > s.measureDays };
}

const segMinutes = (s: Segment, fallbackEnd?: string | null) => {
  const end = s.ended_at ?? fallbackEnd;
  if (!end) return 0;
  return Math.max(0, (new Date(end).getTime() - new Date(s.started_at).getTime()) / 60_000);
};

export type DaySummary = {
  date: string;
  wake: number | null;
  left: number | null;
  arrive: number | null; // actual if tapped, else left + commute
  arriveEstimated: boolean;
  byTask: Record<number, number>;
  tracked: number;
  prepDone: number; // items checked the evening before
};

export function summarizeDay(day: MorningDay, segments: Segment[], prepDone: number): DaySummary {
  const commute = getSetting("profile").commuteMin;
  const byTask: Record<number, number> = {};
  for (const s of segments) byTask[s.task_id] = (byTask[s.task_id] ?? 0) + segMinutes(s, day.left_at);
  const left = day.left_at ? minutesFromTimestamp(day.left_at) : null;
  const arrive = day.arrived_at ? minutesFromTimestamp(day.arrived_at) : left !== null ? left + commute : null;
  return {
    date: day.date,
    wake: day.woke_at ? minutesFromTimestamp(day.woke_at) : null,
    left,
    arrive,
    arriveEstimated: !day.arrived_at && left !== null,
    byTask,
    tracked: Object.values(byTask).reduce((a, b) => a + b, 0),
    prepDone,
  };
}

/** Mornings in the last `days` days, newest first. */
export function morningHistory(days = 14, until = isoDate()): DaySummary[] {
  const from = addDays(until, -(days - 1));
  const dayRows = all<MorningDay>(
    "SELECT * FROM morning_days WHERE date BETWEEN ? AND ? ORDER BY date DESC",
    from,
    until,
  );
  const segs = all<Segment>("SELECT * FROM morning_segments WHERE date BETWEEN ? AND ?", from, until);
  const prep = all<{ date: string; n: number }>(
    "SELECT date, COUNT(*) AS n FROM prep_checks WHERE date BETWEEN ? AND ? GROUP BY date",
    addDays(from, -1),
    until,
  );
  const prepByEvening = new Map(prep.map((p) => [p.date, p.n]));
  return dayRows.map((d) =>
    summarizeDay(
      d,
      segs.filter((s) => s.date === d.date),
      prepByEvening.get(addDays(d.date, -1)) ?? 0,
    ),
  );
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export type MorningStats = {
  mornings: number;
  avgWake: number | null;
  avgLeft: number | null;
  avgArrive: number | null;
  onTime: number; // mornings arriving at or before goal
  withArrival: number;
  avgByTask: { taskId: number; name: string; avg: number; days: number }[];
  avgUntracked: number | null; // wake→leave time not inside any task
  prepEffect: { fullPrep: number | null; noPrep: number | null; fullDays: number; otherDays: number };
};

export function morningStats(days = 14): MorningStats {
  const history = morningHistory(days);
  const goal = parseHHMM(getSetting("profile").goalArrive);
  const tasks = morningTasks(true);
  const prepCount = prepItems().length;
  const withArrive = history.filter((h) => h.arrive !== null);

  const avgByTask = tasks
    .map((t) => {
      const vals = history.map((h) => h.byTask[t.id]).filter((v): v is number => v !== undefined);
      return { taskId: t.id, name: t.name, avg: avg(vals) ?? 0, days: vals.length };
    })
    .filter((t) => t.days > 0);

  const untracked = history
    .filter((h) => h.wake !== null && h.left !== null)
    .map((h) => Math.max(0, h.left! - h.wake! - h.tracked));

  const full = withArrive.filter((h) => prepCount > 0 && h.prepDone >= prepCount);
  const other = withArrive.filter((h) => !(prepCount > 0 && h.prepDone >= prepCount));

  return {
    mornings: history.length,
    avgWake: avg(history.flatMap((h) => (h.wake !== null ? [h.wake] : []))),
    avgLeft: avg(history.flatMap((h) => (h.left !== null ? [h.left] : []))),
    avgArrive: avg(withArrive.map((h) => h.arrive!)),
    onTime: withArrive.filter((h) => h.arrive! <= goal).length,
    withArrival: withArrive.length,
    avgByTask,
    avgUntracked: avg(untracked),
    prepEffect: {
      fullPrep: avg(full.map((h) => h.arrive!)),
      noPrep: avg(other.map((h) => h.arrive!)),
      fullDays: full.length,
      otherDays: other.length,
    },
  };
}
