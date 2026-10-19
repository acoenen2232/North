import webpush, { type PushSubscription } from "web-push";
import { all, run } from "@/lib/db";
import { getRaw, setRaw } from "@/modules/core/settings";

export type Reminder = {
  id: number;
  title: string;
  body: string | null;
  time: string;
  days: string;
  url: string;
  kind: "custom" | "leave_by";
  active: number;
  last_sent: string | null;
};

/** VAPID keys identify this server to Apple's push service. Made once, kept in the local database. */
export function vapidKeys(): { publicKey: string; privateKey: string } {
  const stored = getRaw("vapid");
  if (stored) return JSON.parse(stored);
  const keys = webpush.generateVAPIDKeys();
  setRaw("vapid", JSON.stringify(keys));
  return keys;
}

let configured = false;
function configure() {
  if (configured) return;
  const { publicKey, privateKey } = vapidKeys();
  webpush.setVapidDetails(process.env.NORTH_PUSH_CONTACT || "mailto:north@example.com", publicKey, privateKey);
  configured = true;
}

export function subscriptionCount(): number {
  return all<{ n: number }>("SELECT COUNT(*) AS n FROM push_subscriptions")[0]?.n ?? 0;
}

export function reminders(): Reminder[] {
  return all<Reminder>("SELECT * FROM reminders ORDER BY kind = 'leave_by' DESC, time");
}

/** Send to every subscribed device. Drops subscriptions the push service says are gone. */
export async function sendPush(payload: { title: string; body?: string; url?: string; tag?: string }): Promise<number> {
  configure();
  const subs = all<{ endpoint: string; json: string }>("SELECT endpoint, json FROM push_subscriptions");
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(JSON.parse(s.json) as PushSubscription, JSON.stringify(payload), { TTL: 60 * 30 });
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) run("DELETE FROM push_subscriptions WHERE endpoint = ?", s.endpoint);
        else console.error("[north] push failed", status ?? err);
      }
    }),
  );
  return sent;
}
