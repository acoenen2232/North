"use server";

import { refresh } from "next/cache";
import { run } from "@/lib/db";
import { nowStamp } from "@/lib/dates";
import { sendPush } from "./server";

type SubscriptionJSON = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function subscribePush(sub: SubscriptionJSON) {
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("Bad subscription");
  run(
    "INSERT INTO push_subscriptions (endpoint, json, created_at) VALUES (?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET json = excluded.json",
    sub.endpoint,
    JSON.stringify(sub),
    nowStamp(),
  );
  refresh();
}

export async function unsubscribePush(endpoint: string) {
  run("DELETE FROM push_subscriptions WHERE endpoint = ?", endpoint);
  refresh();
}

export async function sendTestPush(): Promise<number> {
  return sendPush({ title: "North", body: "Reminders are on. Vera says hi.", url: "/settings", tag: "test" });
}

export async function addReminder(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const time = String(formData.get("time") ?? "");
  if (!title || !/^\d{2}:\d{2}$/.test(time)) return;
  const days = formData.getAll("days").map(String).filter((d) => /^[0-6]$/.test(d)).join("") || "0123456";
  run(
    "INSERT INTO reminders (title, body, time, days, url) VALUES (?, ?, ?, ?, ?)",
    title,
    String(formData.get("body") ?? "").trim() || null,
    time,
    days,
    String(formData.get("url") || "/"),
  );
  refresh();
}

export async function toggleReminder(id: number) {
  run("UPDATE reminders SET active = 1 - active WHERE id = ?", id);
  refresh();
}

export async function setReminderTime(id: number, formData: FormData) {
  const time = String(formData.get("time") ?? "");
  if (/^\d{2}:\d{2}$/.test(time)) run("UPDATE reminders SET time = ? WHERE id = ? AND kind = 'custom'", time, id);
  refresh();
}

export async function deleteReminder(id: number) {
  run("DELETE FROM reminders WHERE id = ? AND kind = 'custom'", id);
  refresh();
}
