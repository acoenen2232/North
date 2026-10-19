"use server";

import { refresh } from "next/cache";
import { all, get, run, tx } from "@/lib/db";
import { addDays, formatDay, formatTime, isoDate, minutesOfDay, nowStamp, parseHHMM, weekStart } from "@/lib/dates";
import { getSetting } from "@/modules/core/settings";
import { eventsOn } from "@/modules/heading/queries";
import { askVera, VeraError } from "./coach";
import {
  calendarText,
  checkinText,
  habitText,
  morningText,
  profileText,
  starsText,
  trueNorthText,
  weekDigest,
} from "./context";
import { BearingsSchema, DailyPlanSchema } from "./schemas";
import { trueNorthSections, type TrueNorthSection } from "./queries";

export type VeraState = { error?: string; ok?: boolean };

export async function generateDailyPlan(): Promise<VeraState> {
  const today = isoDate();
  const nowMin = minutesOfDay();
  const p = getSetting("profile");
  const workDay = p.workDays.includes(String(new Date().getDay()));
  const yesterdayPlan = get<{ content: string }>("SELECT content FROM vera_plans WHERE date = ?", addDays(today, -1));

  const prompt = `Today is ${formatDay(today)}. It's ${formatTime(nowMin)} now.

<true_north>
${trueNorthText()}
</true_north>

<profile>
${profileText()}
Today is ${workDay ? `a work day (${formatTime(parseHHMM(p.workStart))}–${formatTime(parseHHMM(p.workEnd))}, treat as busy)` : "not a work day"}.
</profile>

<today_calendar>
${calendarText(today)}
</today_calendar>

<stars>
${starsText(today)}
</stars>

<last_7_days>
Mornings:
${morningText(7)}

Check-ins:
${checkinText(addDays(today, -7), today)}

Habits:
${habitText(addDays(today, -6), today)}
</last_7_days>
${yesterdayPlan ? `\n<yesterdays_plan>\n${yesterdayPlan.content}\n</yesterdays_plan>\n` : ""}
Plan the rest of today. Add blocks only in free time after now and before about 10 PM, never overlapping existing timed events${
    workDay ? " or work hours" : ""
  }. At most 5 blocks. If the brisk dog walk and stretch aren't logged today, give them an evening block. If morning mode is improving, include evening prep before bed. Leave real rest. Match the load to her latest energy and sleep. Use Star ids exactly as given. Pick at most 3 focus stars.`;

  try {
    const { output, model } = await askVera("daily_plan", DailyPlanSchema, prompt);
    output.blocks = output.blocks.filter((b) => /^\d{2}:\d{2}$/.test(b.start) && /^\d{2}:\d{2}$/.test(b.end) && b.end > b.start);
    run(
      `INSERT INTO vera_plans (date, content, model, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET content = excluded.content, model = excluded.model, created_at = excluded.created_at, accepted_at = NULL`,
      today,
      JSON.stringify(output),
      model,
      nowStamp(),
    );
  } catch (err) {
    if (err instanceof VeraError) return { error: err.message };
    throw err;
  }
  refresh();
  return { ok: true };
}

/** Put Vera's proposed blocks on today's calendar. Re-accepting replaces the previous Vera blocks. */
export async function acceptDailyPlan(date: string) {
  const row = get<{ content: string }>("SELECT content FROM vera_plans WHERE date = ?", date);
  if (!row) return;
  const plan = DailyPlanSchema.parse(JSON.parse(row.content));
  const taken = eventsOn(date).filter((e) => e.source !== "vera" && e.start_min !== null);
  tx(() => {
    run("DELETE FROM events WHERE date = ? AND source = 'vera' AND repeat = 'none'", date);
    for (const b of plan.blocks) {
      const start = parseHHMM(b.start);
      const end = parseHHMM(b.end);
      const clash = taken.some((e) => start < (e.end_min ?? e.start_min! + 30) && end > e.start_min!);
      if (clash) continue;
      run(
        `INSERT INTO events (title, date, start_min, end_min, category, notes, source, star_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'vera', ?, ?)`,
        b.title,
        date,
        start,
        end,
        b.category,
        b.why,
        b.star_id,
        nowStamp(),
      );
    }
    run("UPDATE vera_plans SET accepted_at = ? WHERE date = ?", nowStamp(), date);
  });
  refresh();
}

export async function generateBearings(): Promise<VeraState> {
  const today = isoDate();
  const from = addDays(today, -6);
  const key = weekStart(today);
  const last = all<{ week_start: string; content: string }>(
    "SELECT week_start, content FROM bearings WHERE week_start < ? ORDER BY week_start DESC LIMIT 1",
    key,
  )[0];

  const prompt = `This is Bearings, the weekly review, covering ${formatDay(from)} to ${formatDay(today)}.

<true_north>
${trueNorthText()}
</true_north>

<week>
${weekDigest(from, today)}
</week>
${last ? `\n<last_bearings week_of="${last.week_start}">\n${last.content}\n</last_bearings>\nStart by checking whether last week's one change happened, using the data.\n` : ""}
Review the week: wins, patterns (look across areas), drift, and exactly one change for next week. Add to True North only durable learnings the data supports, phrased as short lines. Don't repeat lines already in True North.`;

  try {
    const { output, model } = await askVera("bearings", BearingsSchema, prompt);
    tx(() => {
      run(
        `INSERT INTO bearings (week_start, content, model, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(week_start) DO UPDATE SET content = excluded.content, model = excluded.model, created_at = excluded.created_at`,
        key,
        JSON.stringify(output),
        model,
        nowStamp(),
      );
      const stamp = formatDay(today, { month: "short", day: "numeric" });
      for (const u of output.true_north_updates) {
        run(
          `UPDATE true_north SET content = TRIM(content || char(10) || ?), updated_at = ? WHERE section = ?`,
          `- ${u.add} (Vera, ${stamp})`,
          nowStamp(),
          u.section,
        );
      }
    });
  } catch (err) {
    if (err instanceof VeraError) return { error: err.message };
    throw err;
  }
  refresh();
  return { ok: true };
}

export async function saveTrueNorth(formData: FormData) {
  const now = nowStamp();
  tx(() => {
    for (const section of Object.keys(trueNorthSections) as TrueNorthSection[]) {
      const v = formData.get(section);
      if (v === null) continue;
      run("UPDATE true_north SET content = ?, updated_at = ? WHERE section = ?", String(v).trim(), now, section);
    }
  });
  refresh();
}
