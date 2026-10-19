"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Current time, ticking. Null on the server so server and client markup match. */
export function useNow(intervalMs = 1000): Date | null {
  const subscribe = useCallback(
    (onTick: () => void) => {
      const t = setInterval(onTick, intervalMs);
      return () => clearInterval(t);
    },
    [intervalMs],
  );
  // Quantized so the snapshot is stable between ticks.
  const ms = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  );
  return ms === null ? null : new Date(ms);
}

export const clock = (d: Date) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

export function fmtClock(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function fmtTimer(totalMin: number): string {
  const s = Math.max(0, Math.round(totalMin * 60));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return h ? `${h}:${mm}:${String(sec).padStart(2, "0")}` : `${mm}:${String(sec).padStart(2, "0")}`;
}
