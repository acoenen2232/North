import { run } from "./db";
import { isoDate, minutesOfDay, parseHHMM } from "./dates";
import { backupDir, backupNow, lastBackup } from "./backup";
import { reminders, sendPush, subscriptionCount } from "@/modules/push/server";
import { leaveByMin, morningPhase } from "@/modules/morning/queries";
import { getSetting } from "@/modules/core/settings";

// Runs inside the North server: fires reminders and the nightly backup.
// A reminder fires once per day, within 15 minutes after its time (so a restart doesn't replay old ones).

const WINDOW = 15;
const BACKUP_AT = 2 * 60; // 2:00 AM

const g = globalThis as unknown as { __northScheduler?: NodeJS.Timeout };

export function startScheduler() {
  if (g.__northScheduler) return;
  g.__northScheduler = setInterval(() => {
    tick().catch((err) => console.error("[north] scheduler", err));
  }, 30_000);
  console.log("[north] scheduler running");
}

async function tick() {
  const today = isoDate();
  const now = minutesOfDay();
  const dow = String(new Date().getDay());

  if (subscriptionCount() > 0) {
    for (const r of reminders()) {
      if (!r.active || r.last_sent === today || !r.days.includes(dow)) continue;
      let at = parseHHMM(r.time);
      if (r.kind === "leave_by") {
        if (morningPhase().phase !== "improve") continue;
        if (!getSetting("profile").workDays.includes(dow)) continue;
        at = leaveByMin() - 10;
      }
      if (now < at || now >= at + WINDOW) continue;
      run("UPDATE reminders SET last_sent = ? WHERE id = ?", today, r.id);
      await sendPush({ title: r.title, body: r.body ?? undefined, url: r.url, tag: `reminder-${r.id}` });
    }
  }

  if (backupDir() && now >= BACKUP_AT && lastBackup()?.date !== today) {
    try {
      console.log("[north] backup written to", backupNow());
    } catch (err) {
      console.error("[north] backup failed (is the backup drive plugged in?)", err);
    }
  }
}
