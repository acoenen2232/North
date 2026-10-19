"use client";

import { useEffect } from "react";

// Registers /sw.js so reminders can arrive as push notifications once the app is on the home screen.
export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
  }, []);
  return null;
}
