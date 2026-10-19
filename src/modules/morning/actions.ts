"use server";

import { refresh } from "next/cache";
import { get, run, tx } from "@/lib/db";
import { isoDate, nowStamp, parseDate, parseHHMM } from "@/lib/dates";
import { setSetting } from "@/modules/core/settings";

function ensureDay(date: string) {
  run("INSERT OR IGNORE INTO morning_days (date) VALUES (?)", date);
}

function closeOpenSegment(date: string, at = nowStamp()) {
  run("UPDATE morning_segments SET ended_at = ? WHERE date = ? AND ended_at IS NULL", at, date);
}

export async function wakeUp() {
  const date = isoDate();
  ensureDay(date);
  run("UPDATE morning_days SET woke_at = COALESCE(woke_at, ?) WHERE date = ?", nowStamp(), date);
  refresh();
}

/** Start a task. Only one runs at a time, so starting one stops the other. */
export async function startTask(taskId: number) {
  const date = isoDate();
  const now = nowStamp();
  tx(() => {
    ensureDay(date);
    run("UPDATE morning_days SET woke_at = COALESCE(woke_at, ?) WHERE date = ?", now, date);
    closeOpenSegment(date, now);
    run("INSERT INTO morning_segments (date, task_id, started_at) VALUES (?, ?, ?)", date, taskId, now);
  });
  refresh();
}

export async function stopTask() {
  closeOpenSegment(isoDate());
  refresh();
}

export async function leaveNow() {
  const date = isoDate();
  const now = nowStamp();
  tx(() => {
    ensureDay(date);
    closeOpenSegment(date, now);
    run("UPDATE morning_days SET left_at = ? WHERE date = ?", now, date);
  });
  refresh();
}

export async function arrived() {
  const date = isoDate();
  ensureDay(date);
  run("UPDATE morning_days SET arrived_at = ? WHERE date = ?", nowStamp(), date);
  refresh();
}

/** Fix a time you forgot to tap. Empty value clears it. */
export async function fixTimes(formData: FormData) {
  const date = String(formData.get("date") || isoDate());
  ensureDay(date);
  const stamp = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    if (!/^\d{2}:\d{2}$/.test(s)) return null;
    const d = parseDate(date);
    const min = parseHHMM(s);
    d.setHours(Math.floor(min / 60), min % 60, 0, 0);
    return d.toISOString();
  };
  run(
    "UPDATE morning_days SET woke_at = ?, left_at = ?, arrived_at = ? WHERE date = ?",
    stamp(formData.get("woke")),
    stamp(formData.get("left")),
    stamp(formData.get("arrived")),
    date,
  );
  refresh();
}

export async function deleteSegment(id: number) {
  run("DELETE FROM morning_segments WHERE id = ?", id);
  refresh();
}

export async function togglePrep(itemId: number, date: string) {
  const exists = get("SELECT 1 FROM prep_checks WHERE date = ? AND item_id = ?", date, itemId);
  if (exists) run("DELETE FROM prep_checks WHERE date = ? AND item_id = ?", date, itemId);
  else run("INSERT INTO prep_checks (date, item_id, checked_at) VALUES (?, ?, ?)", date, itemId, nowStamp());
  refresh();
}

export async function addMorningTask(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  run("INSERT INTO morning_tasks (name, sort) VALUES (?, (SELECT COALESCE(MAX(sort), 0) + 1 FROM morning_tasks))", name);
  refresh();
}

export async function archiveMorningTask(id: number) {
  run("UPDATE morning_tasks SET active = 0 WHERE id = ?", id);
  refresh();
}

export async function addPrepItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  run("INSERT INTO prep_items (name, sort) VALUES (?, (SELECT COALESCE(MAX(sort), 0) + 1 FROM prep_items))", name);
  refresh();
}

export async function archivePrepItem(id: number) {
  run("UPDATE prep_items SET active = 0 WHERE id = ?", id);
  refresh();
}

export async function setMorningPhase(phase: "measure" | "improve") {
  setSetting("morning", { phase, phaseStarted: isoDate() });
  refresh();
}
