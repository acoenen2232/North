"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { get, run, tx } from "@/lib/db";
import { isoDate, nowStamp } from "@/lib/dates";
import { fixes, reasonKeys, type Reason } from "./fixes";

const dateOrNull = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

export async function addStar(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const kind = formData.get("kind") === "goal" ? "goal" : "todo";
  const goalId = Number(formData.get("goal_id")) || null;
  run(
    `INSERT INTO stars (title, kind, goal_id, why, due_date, planned_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    title,
    kind,
    kind === "todo" ? goalId : null,
    String(formData.get("why") ?? "").trim() || null,
    dateOrNull(formData.get("due_date")),
    formData.get("today") === "on" ? isoDate() : dateOrNull(formData.get("planned_date")),
    nowStamp(),
  );
  refresh();
}

export async function completeStar(id: number) {
  const s = get<{ status: string }>("SELECT status FROM stars WHERE id = ?", id);
  if (!s) return;
  if (s.status === "done") run("UPDATE stars SET status = 'open', done_at = NULL WHERE id = ?", id);
  else run("UPDATE stars SET status = 'done', done_at = ? WHERE id = ?", nowStamp(), id);
  refresh();
}

export async function dropStar(id: number) {
  run("UPDATE stars SET status = 'dropped', done_at = ? WHERE id = ?", nowStamp(), id);
  redirect("/stars");
}

export async function planStarToday(id: number) {
  run("UPDATE stars SET planned_date = ? WHERE id = ?", isoDate(), id);
  refresh();
}

export async function updateStar(id: number, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  run(
    "UPDATE stars SET title = ?, why = ?, due_date = ?, planned_date = ?, goal_id = ? WHERE id = ?",
    title,
    String(formData.get("why") ?? "").trim() || null,
    dateOrNull(formData.get("due_date")),
    dateOrNull(formData.get("planned_date")),
    Number(formData.get("goal_id")) || null,
    id,
  );
  refresh();
}

/** Log a stuck moment and the fix being tried. "split_3" also creates the three sub-steps. */
export async function tryFix(starId: number, reason: string, fixKey: string, formData: FormData) {
  if (!reasonKeys.includes(reason as Reason)) return;
  if (!fixes[reason as Reason].some((f) => f.key === fixKey)) return;
  const steps = [1, 2, 3].map((i) => String(formData.get(`step${i}`) ?? "").trim()).filter(Boolean);
  const nextAction = String(formData.get("next_action") ?? "").trim();
  tx(() => {
    run("INSERT INTO stuck_logs (star_id, reason, fix, created_at) VALUES (?, ?, ?, ?)", starId, reason, fixKey, nowStamp());
    const parent = get<{ goal_id: number | null; kind: string }>("SELECT goal_id, kind FROM stars WHERE id = ?", starId);
    for (const step of steps) {
      run(
        "INSERT INTO stars (title, kind, goal_id, planned_date, created_at) VALUES (?, 'todo', ?, ?, ?)",
        step,
        parent?.kind === "goal" ? starId : (parent?.goal_id ?? null),
        isoDate(),
        nowStamp(),
      );
    }
    if (nextAction) run("UPDATE stars SET title = ? WHERE id = ?", nextAction, starId);
  });
  redirect(`/stars/${starId}`);
}

export async function rateFix(logId: number, outcome: "helped" | "didnt") {
  run("UPDATE stuck_logs SET outcome = ?, resolved_at = ? WHERE id = ?", outcome, nowStamp(), logId);
  refresh();
}
