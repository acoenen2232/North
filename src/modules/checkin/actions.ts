"use server";

import { refresh } from "next/cache";
import { run } from "@/lib/db";
import { isoDate, nowStamp } from "@/lib/dates";

const scale = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

export async function saveCheckin(formData: FormData) {
  const date = String(formData.get("date") || isoDate());
  const hours = Number(formData.get("sleep_hours"));
  run(
    `INSERT INTO checkins (date, mood, energy, sleep_hours, sleep_quality, note, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       mood = excluded.mood, energy = excluded.energy, sleep_hours = excluded.sleep_hours,
       sleep_quality = excluded.sleep_quality, note = excluded.note, updated_at = excluded.updated_at`,
    date,
    scale(formData.get("mood")),
    scale(formData.get("energy")),
    Number.isFinite(hours) && hours > 0 && hours <= 16 ? hours : null,
    scale(formData.get("sleep_quality")),
    String(formData.get("note") ?? "").trim() || null,
    nowStamp(),
  );
  refresh();
}
