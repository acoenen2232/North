"use server";

import { refresh } from "next/cache";
import { get, run } from "@/lib/db";
import { addDays, isoDate, nowStamp, parseHHMM } from "@/lib/dates";
import { categoryKeys } from "./categories";

const REPEATS = ["none", "daily", "weekdays", "weekly"] as const;

function readTime(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  return /^\d{1,2}:\d{2}$/.test(s) ? parseHHMM(s) : null;
}

export async function addEvent(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const date = String(formData.get("date") || isoDate());
  const start = readTime(formData.get("start"));
  let end = readTime(formData.get("end"));
  if (start !== null && (end === null || end <= start)) end = start + 30;
  const category = String(formData.get("category") ?? "block");
  const repeat = String(formData.get("repeat") ?? "none");
  run(
    `INSERT INTO events (title, date, start_min, end_min, category, notes, repeat, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'me', ?)`,
    title,
    date,
    start,
    end,
    categoryKeys.includes(category as never) ? category : "block",
    String(formData.get("notes") ?? "").trim() || null,
    (REPEATS as readonly string[]).includes(repeat) ? repeat : "none",
    nowStamp(),
  );
  refresh();
}

export async function toggleEventDone(id: number, date: string) {
  const done = get("SELECT 1 FROM event_done WHERE event_id = ? AND date = ?", id, date);
  if (done) run("DELETE FROM event_done WHERE event_id = ? AND date = ?", id, date);
  else run("INSERT INTO event_done (event_id, date) VALUES (?, ?)", id, date);
  refresh();
}

/** scope "one" skips a single occurrence of a repeating event; "all" deletes it (or ends the series). */
export async function removeEvent(id: number, date: string, scope: "one" | "all") {
  const ev = get<{ repeat: string; date: string }>("SELECT repeat, date FROM events WHERE id = ?", id);
  if (!ev) return;
  if (ev.repeat === "none" || (scope === "all" && date <= ev.date)) {
    run("DELETE FROM events WHERE id = ?", id);
  } else if (scope === "one") {
    run("INSERT OR IGNORE INTO event_skips (event_id, date) VALUES (?, ?)", id, date);
  } else {
    // End the series the day before, keeping its history.
    run("UPDATE events SET repeat_until = ? WHERE id = ?", addDays(date, -1), id);
  }
  refresh();
}
