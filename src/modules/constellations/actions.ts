"use server";

import { refresh } from "next/cache";
import { get, run } from "@/lib/db";
import { isoDate, nowStamp } from "@/lib/dates";

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim() || null;

/** One tap: log a good habit for today, or undo today's log. */
export async function toggleHabitToday(habitId: number) {
  const date = isoDate();
  const existing = get<{ id: number }>("SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?", habitId, date);
  if (existing) run("DELETE FROM habit_logs WHERE habit_id = ? AND date = ?", habitId, date);
  else run("INSERT INTO habit_logs (habit_id, date, logged_at) VALUES (?, ?, ?)", habitId, date, nowStamp());
  refresh();
}

export async function saveWentRight(logId: number, formData: FormData) {
  run("UPDATE habit_logs SET went_right = ? WHERE id = ?", text(formData.get("went_right")), logId);
  refresh();
}

/** A bad habit happened: record its triggers. Chips or free text, whichever was used. */
export async function logBadHabit(habitId: number, formData: FormData) {
  const pick = (k: string) => text(formData.get(`${k}_other`)) ?? text(formData.get(k));
  run(
    "INSERT INTO habit_logs (habit_id, date, logged_at, place, mood, people, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
    habitId,
    isoDate(),
    nowStamp(),
    pick("place"),
    pick("mood"),
    pick("people"),
    text(formData.get("note")),
  );
  refresh();
}

export async function addHabit(formData: FormData) {
  const name = text(formData.get("name"));
  if (!name) return;
  const kind = formData.get("kind") === "bad" ? "bad" : "good";
  const perWeek = Math.min(7, Math.max(1, Number(formData.get("per_week")) || 7));
  run(
    `INSERT INTO habits (name, kind, per_week, description, sort, created_at)
     VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort), 0) + 1 FROM habits), ?)`,
    name,
    kind,
    perWeek,
    text(formData.get("description")),
    nowStamp(),
  );
  refresh();
}

export async function archiveHabit(id: number) {
  run("UPDATE habits SET archived = 1 WHERE id = ?", id);
  refresh();
}
