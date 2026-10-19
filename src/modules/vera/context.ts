import { addDays, formatDay, formatDuration, formatTime, minutesFromTimestamp, parseHHMM } from "@/lib/dates";
import { getSetting } from "@/modules/core/settings";
import { leaveByMin, morningHistory, morningPhase, morningStats, morningTasks } from "@/modules/morning/queries";
import { checkinsBetween } from "@/modules/checkin/queries";
import { habits, logsBetween } from "@/modules/constellations/queries";
import { goals, openTodos, recentlyDone, stuckPatterns } from "@/modules/stars/queries";
import { eventsOn, minutesByCategory } from "@/modules/heading/queries";
import { categoryOf } from "@/modules/heading/categories";
import { reasons, fixFor, type Reason } from "@/modules/stars/fixes";
import { trueNorth, trueNorthSections } from "./queries";

// Plain-text digests of each module. Only what Vera needs, and nothing leaves the laptop
// except these summaries in the request to Claude.

const t = (min: number | null | undefined) => (min === null || min === undefined ? "—" : formatTime(min));
const dayName = (d: string) => formatDay(d, { weekday: "short", month: "short", day: "numeric" });

export function trueNorthText(): string {
  const tn = trueNorth();
  return (Object.keys(trueNorthSections) as (keyof typeof trueNorthSections)[])
    .map((k) => `## ${trueNorthSections[k].label}\n${tn[k].trim() || "(empty)"}`)
    .join("\n\n");
}

export function profileText(): string {
  const p = getSetting("profile");
  const phase = morningPhase();
  return [
    `Wake target ${t(parseHHMM(p.wakeTime))}. Work ${t(parseHHMM(p.workStart))}–${t(parseHHMM(p.workEnd))} on ${workDayNames(p.workDays)}.`,
    `Commute ${p.commuteMin} min. Goal: arrive by ${t(parseHHMM(p.goalArrive))} (leave by ${t(leaveByMin())}).`,
    phase.phase === "measure"
      ? `Morning mode: MEASURING (day ${phase.day} of ${phase.measureDays}). No morning changes yet; observe only.`
      : `Morning mode: IMPROVING since ${phase.phaseStarted} (evening prep checklist + leave-by countdown on).`,
  ].join("\n");
}

function workDayNames(days: string) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.split("").map((d) => names[Number(d)]).join(", ");
}

export function morningText(days: number): string {
  const hist = morningHistory(days);
  if (!hist.length) return "No mornings tracked yet.";
  const tasks = new Map(morningTasks(true).map((x) => [x.id, x.name]));
  const goal = parseHHMM(getSetting("profile").goalArrive);
  const s = morningStats(days);
  const lines = hist
    .slice()
    .reverse()
    .map((h) => {
      const parts = Object.entries(h.byTask).map(([id, m]) => `${tasks.get(Number(id)) ?? "?"} ${Math.round(m)}m`);
      const late = h.arrive !== null ? Math.round(h.arrive - goal) : null;
      return `${dayName(h.date)}: up ${t(h.wake)}, left ${t(h.left)}, arrived ${t(h.arrive)}${h.arriveEstimated ? " (est.)" : ""}${
        late !== null ? ` (${late > 0 ? `${late} min late` : "on time"})` : ""
      }; ${parts.join(", ") || "no tasks timed"}; prep done night before: ${h.prepDone}`;
    });
  return [
    ...lines,
    `Averages: up ${t(s.avgWake)}, leave ${t(s.avgLeft)}, arrive ${t(s.avgArrive)}; on time ${s.onTime}/${s.withArrival}.`,
    s.avgUntracked !== null ? `Untracked "in between" time averages ${formatDuration(s.avgUntracked)}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function checkinText(from: string, to: string): string {
  const rows = checkinsBetween(from, to);
  if (!rows.length) return "No check-ins.";
  return rows
    .map(
      (c) =>
        `${dayName(c.date)}: mood ${c.mood ?? "—"}/5, energy ${c.energy ?? "—"}/5, sleep ${c.sleep_hours ?? "—"}h (quality ${
          c.sleep_quality ?? "—"
        }/5)${c.note ? `. "${c.note}"` : ""}`,
    )
    .join("\n");
}

export function habitText(from: string, to: string): string {
  const hs = habits();
  const logs = logsBetween(from, to);
  const lines = hs.map((h) => {
    const mine = logs.filter((l) => l.habit_id === h.id);
    if (h.kind === "good") {
      const right = mine.filter((l) => l.went_right).map((l) => `"${l.went_right}"`);
      return `Build "${h.name}" (target ${h.per_week}/wk): done on ${mine.map((l) => dayName(l.date)).join(", ") || "no days"}${
        right.length ? `. What went right: ${right.join("; ")}` : ""
      }`;
    }
    const occ = mine.map(
      (l) =>
        `${dayName(l.date)} ${formatTime(minutesFromTimestamp(l.logged_at))}${[l.place, l.mood, l.people].filter(Boolean).length ? ` [${[l.place, l.mood, l.people].filter(Boolean).join(", ")}]` : ""}${l.note ? ` "${l.note}"` : ""}`,
    );
    return `Break "${h.name}": ${occ.length} times${occ.length ? `: ${occ.join("; ")}` : ""}`;
  });
  return lines.join("\n") || "No habits set up.";
}

export function starsText(today: string): string {
  const gs = goals();
  const todos = openTodos();
  const done = recentlyDone(7, today);
  const fmt = (s: { id: number; title: string; due_date: string | null; planned_date: string | null; created_at: string }) =>
    `#${s.id} "${s.title}"${s.due_date ? ` due ${s.due_date}` : ""}${s.planned_date ? ` planned ${s.planned_date}` : ""}${
      s.created_at.slice(0, 10) < addDays(today, -14) ? " (open 2+ weeks)" : ""
    }`;
  const stuck = stuckPatterns().map(
    (p) =>
      `${reasons[p.reason as Reason]?.label ?? p.reason} ×${p.count}${
        p.bestFix ? `; best fix so far: ${fixFor(p.reason, p.bestFix)?.label} (${Math.round((p.bestRate ?? 0) * 100)}% helped)` : ""
      }`,
  );
  return [
    gs.length ? `Goals:\n${gs.map((g) => `- ${fmt(g)}${g.why ? ` — why: ${g.why}` : ""}`).join("\n")}` : "No goals set.",
    todos.length
      ? `Open to-dos:\n${todos.map((s) => `- ${fmt(s)}${s.goal_id ? ` (goal #${s.goal_id})` : ""}`).join("\n")}`
      : "No open to-dos.",
    `Done in the last 7 days: ${done.length ? done.map((d) => `"${d.title}"`).join(", ") : "none"}`,
    stuck.length ? `Procrastination reasons logged: ${stuck.join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function calendarText(date: string): string {
  const evs = eventsOn(date);
  if (!evs.length) return "Nothing on the calendar.";
  return evs
    .map(
      (e) =>
        `${e.start_min !== null ? `${formatTime(e.start_min)}–${formatTime(e.end_min ?? e.start_min + 30)}` : "Anytime"}: ${e.title} [${categoryOf(e.category).label}]${e.done ? " ✓" : ""}`,
    )
    .join("\n");
}

export function timeBalanceText(from: string, to: string): string {
  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);
  const mins = minutesByCategory(dates);
  const parts = Object.entries(mins).map(([k, m]) => `${categoryOf(k).label} ${formatDuration(m)}`);
  return parts.length ? `Scheduled time by kind: ${parts.join(", ")}` : "No timed blocks scheduled.";
}

/** Everything about the last `days` days, for Bearings. */
export function weekDigest(from: string, to: string): string {
  const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1;
  return [
    `# Profile\n${profileText()}`,
    `# Mornings\n${morningText(days)}`,
    `# Check-ins\n${checkinText(from, to)}`,
    `# Habits (Constellations)\n${habitText(from, to)}`,
    `# Stars\n${starsText(to)}`,
    `# Calendar\n${timeBalanceText(from, to)}`,
  ].join("\n\n");
}
