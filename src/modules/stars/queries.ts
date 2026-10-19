import { all, get } from "@/lib/db";
import { addDays } from "@/lib/dates";
import { fixes, type Reason } from "./fixes";

export type Star = {
  id: number;
  title: string;
  kind: "goal" | "todo";
  goal_id: number | null;
  why: string | null;
  due_date: string | null;
  planned_date: string | null;
  status: "open" | "done" | "dropped";
  created_at: string;
  done_at: string | null;
};

export type StuckLog = {
  id: number;
  star_id: number;
  reason: string;
  fix: string;
  created_at: string;
  outcome: "helped" | "didnt" | null;
  resolved_at: string | null;
};

export function goals(): Star[] {
  return all<Star>("SELECT * FROM stars WHERE kind = 'goal' AND status = 'open' ORDER BY created_at");
}

export function openTodos(): Star[] {
  return all<Star>(
    `SELECT * FROM stars WHERE kind = 'todo' AND status = 'open'
     ORDER BY planned_date IS NULL, planned_date, due_date IS NULL, due_date, created_at`,
  );
}

export function star(id: number): Star | undefined {
  return get<Star>("SELECT * FROM stars WHERE id = ?", id);
}

/** To-dos planned for today or earlier, or due within two days. */
export function todayStars(today: string): Star[] {
  return all<Star>(
    `SELECT * FROM stars WHERE kind = 'todo' AND status = 'open'
       AND ((planned_date IS NOT NULL AND planned_date <= ?) OR (due_date IS NOT NULL AND due_date <= ?))
     ORDER BY due_date IS NULL, due_date, planned_date`,
    today,
    addDays(today, 2),
  );
}

export function recentlyDone(days = 7, today: string): Star[] {
  return all<Star>(
    "SELECT * FROM stars WHERE status = 'done' AND done_at >= ? ORDER BY done_at DESC",
    addDays(today, -days),
  );
}

export function stuckLogsFor(starId: number): StuckLog[] {
  return all<StuckLog>("SELECT * FROM stuck_logs WHERE star_id = ? ORDER BY created_at DESC", starId);
}

/** Fixes tried but not yet rated. */
export function pendingStuck(): (StuckLog & { title: string })[] {
  return all<StuckLog & { title: string }>(
    `SELECT l.*, s.title FROM stuck_logs l JOIN stars s ON s.id = l.star_id
     WHERE l.outcome IS NULL ORDER BY l.created_at`,
  );
}

export type FixScore = { key: string; label: string; how: string; helped: number; tried: number };

/** Fixes for a reason, ranked by what has worked for you (unrated fixes keep their default order). */
export function rankedFixes(reason: Reason): FixScore[] {
  const rows = all<{ fix: string; helped: number; tried: number }>(
    `SELECT fix, SUM(outcome = 'helped') AS helped, COUNT(outcome) AS tried
     FROM stuck_logs WHERE reason = ? GROUP BY fix`,
    reason,
  );
  const byKey = new Map(rows.map((r) => [r.fix, r]));
  return fixes[reason]
    .map((f, i) => {
      const r = byKey.get(f.key);
      return { ...f, helped: r?.helped ?? 0, tried: r?.tried ?? 0, i };
    })
    .sort((a, b) => {
      // Laplace-smoothed success rate so one lucky try doesn't dominate.
      const sa = (a.helped + 1) / (a.tried + 2);
      const sb = (b.helped + 1) / (b.tried + 2);
      return sb - sa || a.i - b.i;
    });
}

/** How often each reason comes up and which fixes work. Feeds Vera and True North. */
export function stuckPatterns(): { reason: string; count: number; bestFix: string | null; bestRate: number | null }[] {
  const reasonsSeen = all<{ reason: string; count: number }>(
    "SELECT reason, COUNT(*) AS count FROM stuck_logs GROUP BY reason ORDER BY count DESC",
  );
  return reasonsSeen.map(({ reason, count }) => {
    const best = get<{ fix: string; rate: number }>(
      `SELECT fix, AVG(outcome = 'helped') AS rate FROM stuck_logs
       WHERE reason = ? AND outcome IS NOT NULL GROUP BY fix HAVING COUNT(*) >= 1 ORDER BY rate DESC LIMIT 1`,
      reason,
    );
    return { reason, count, bestFix: best?.fix ?? null, bestRate: best?.rate ?? null };
  });
}
