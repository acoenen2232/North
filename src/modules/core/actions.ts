"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getSetting, setSetting } from "./settings";
import { isoDate } from "@/lib/dates";

const time = (v: FormDataEntryValue | null, fallback: string) => {
  const s = String(v ?? "");
  return /^\d{2}:\d{2}$/.test(s) ? s : fallback;
};

export async function saveProfile(formData: FormData) {
  const current = getSetting("profile");
  const firstRun = !current.setupDone;
  const days = formData.getAll("workDays").map(String).filter((d) => /^[0-6]$/.test(d)).sort().join("");
  setSetting("profile", {
    name: String(formData.get("name") ?? "").trim(),
    wakeTime: time(formData.get("wakeTime"), current.wakeTime),
    workStart: time(formData.get("workStart"), current.workStart),
    workEnd: time(formData.get("workEnd"), current.workEnd),
    workDays: days || current.workDays,
    commuteMin: Math.min(180, Math.max(0, Number(formData.get("commuteMin")) || current.commuteMin)),
    goalArrive: time(formData.get("goalArrive"), current.goalArrive),
    setupDone: true,
  });
  if (firstRun) {
    if (!getSetting("morning").phaseStarted) setSetting("morning", { phase: "measure", phaseStarted: isoDate() });
    redirect("/");
  }
  refresh();
}
