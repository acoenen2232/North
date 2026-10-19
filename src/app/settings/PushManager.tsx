"use client";

import { useEffect, useState, useTransition } from "react";
import { sendTestPush, subscribePush, unsubscribePush } from "@/modules/push/actions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type Status = "loading" | "unsupported" | "needs-install" | "off" | "on" | "denied";

async function detect(): Promise<{ status: Status; sub: PushSubscription | null }> {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { status: ios && !standalone ? "needs-install" : "unsupported", sub: null };
  }
  if (Notification.permission === "denied") return { status: "denied", sub: null };
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return { status: sub ? "on" : "off", sub };
}

export function PushManager({ publicKey }: { publicKey: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    detect().then((d) => {
      if (cancelled) return;
      setSub(d.sub);
      setStatus(d.status);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = () =>
    start(async () => {
      setMsg("");
      try {
        const reg = await navigator.serviceWorker.ready;
        const s = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        await subscribePush(JSON.parse(JSON.stringify(s)));
        setSub(s);
        setStatus("on");
      } catch {
        setStatus(Notification.permission === "denied" ? "denied" : "off");
        setMsg("Couldn't turn on reminders. Try again.");
      }
    });

  const disable = () =>
    start(async () => {
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setSub(null);
      setStatus("off");
    });

  const test = () =>
    start(async () => {
      const n = await sendTestPush();
      setMsg(n ? "Sent. It should arrive in a few seconds." : "No devices subscribed.");
    });

  if (status === "loading") return <p className="muted">Checking…</p>;
  if (status === "needs-install")
    return (
      <p className="muted">
        On iPhone, reminders only work from the home-screen app. In Safari, tap the Share button, then <b>Add to Home Screen</b>,
        and open North from there.
      </p>
    );
  if (status === "unsupported") return <p className="muted">This browser can&apos;t receive reminders.</p>;
  if (status === "denied")
    return <p className="muted">Notifications are blocked. Turn them on in Settings → Notifications → North.</p>;

  return (
    <div className="space-y-2">
      {status === "on" ? (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn" onClick={test} disabled={pending}>
            Send a test
          </button>
          <button className="btn-ghost" onClick={disable} disabled={pending}>
            Turn off here
          </button>
        </div>
      ) : (
        <button className="btn-gold w-full" onClick={enable} disabled={pending}>
          Turn on reminders on this device
        </button>
      )}
      {msg && <p className="text-center text-sm text-ink-muted">{msg}</p>}
    </div>
  );
}
