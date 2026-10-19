import { all, get } from "@/lib/db";
import type { BearingsContent, DailyPlanContent } from "./schemas";

export const trueNorthSections = {
  values: { label: "What matters to me", hint: "Values, priorities, the person you're steering toward." },
  patterns: { label: "Patterns", hint: "What tends to happen. Vera adds what she notices." },
  works: { label: "Works for me", hint: "Strategies that actually work for you." },
  doesnt_work: { label: "Doesn't work for me", hint: "Things that sound good but don't stick." },
  notes: { label: "Other notes", hint: "Anything else Vera should know." },
} as const;

export type TrueNorthSection = keyof typeof trueNorthSections;

export function trueNorth(): Record<TrueNorthSection, string> {
  const rows = all<{ section: TrueNorthSection; content: string }>("SELECT section, content FROM true_north");
  const out = { values: "", patterns: "", works: "", doesnt_work: "", notes: "" };
  for (const r of rows) out[r.section] = r.content;
  return out;
}

export function dailyPlan(date: string): { content: DailyPlanContent; model: string; accepted_at: string | null } | null {
  const row = get<{ content: string; model: string; accepted_at: string | null }>(
    "SELECT content, model, accepted_at FROM vera_plans WHERE date = ?",
    date,
  );
  return row ? { ...row, content: JSON.parse(row.content) } : null;
}

export function bearingsFor(weekStart: string): { content: BearingsContent; model: string; created_at: string } | null {
  const row = get<{ content: string; model: string; created_at: string }>(
    "SELECT content, model, created_at FROM bearings WHERE week_start = ?",
    weekStart,
  );
  return row ? { ...row, content: JSON.parse(row.content) } : null;
}

export function pastBearings(limit = 8): { week_start: string; content: BearingsContent }[] {
  return all<{ week_start: string; content: string }>(
    "SELECT week_start, content FROM bearings ORDER BY week_start DESC LIMIT ?",
    limit,
  ).map((r) => ({ week_start: r.week_start, content: JSON.parse(r.content) }));
}

/** Approximate spend this month, from token counts. Prices per million tokens. */
const PRICES: Record<string, { in: number; out: number; cache: number }> = {
  "claude-sonnet-5-5": { in: 2, out: 10, cache: 0.2 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5, cache: 0.01 },
  "claude-opus-5-5": { in: 4, out: 20, cache: 0.2 },
  "claude-fable-5-1": { in: 10, out: 50, cache: 0.25 },
};

export function spendThisMonth(): { calls: number; dollars: number } {
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  const rows = all<{ model: string; input_tokens: number; output_tokens: number; cache_read_tokens: number }>(
    "SELECT model, input_tokens, output_tokens, cache_read_tokens FROM vera_calls WHERE created_at >= ?",
    since.toISOString(),
  );
  let dollars = 0;
  for (const r of rows) {
    const p = PRICES[r.model] ?? PRICES["claude-opus-5-5"];
    dollars += (r.input_tokens * p.in + r.output_tokens * p.out + r.cache_read_tokens * p.cache) / 1_000_000;
  }
  return { calls: rows.length, dollars };
}
