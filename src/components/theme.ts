"use client";

import { useEffect, useSyncExternalStore } from "react";
import { THEME_COLORS, THEME_KEY } from "@/lib/theme-script";

export type ThemePref = "dark" | "light" | "auto";
export type Theme = "dark" | "light";

const EVENT = "north-theme";

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "auto" ? v : "dark";
  } catch {
    return "dark";
  }
}

const systemLight = () => window.matchMedia("(prefers-color-scheme: light)").matches;

function applyTheme(pref: ThemePref) {
  const theme: Theme = pref === "auto" ? (systemLight() ? "light" : "dark") : pref;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {}
  applyTheme(pref);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  mq.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
    mq.removeEventListener("change", onChange);
  };
}

/** The saved preference; null during server render. */
export function useThemePref(): ThemePref | null {
  return useSyncExternalStore(subscribe, readPref, () => null);
}

/** The theme actually showing; null during server render. */
export function useTheme(): Theme | null {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark"),
    () => null,
  );
}

/** Keeps "match my phone" in sync when the phone switches light/dark, and sets the status-bar color. */
export function ThemeSync() {
  const pref = useThemePref();
  useEffect(() => {
    if (pref === null) return;
    applyTheme(pref);
    if (pref !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme("auto");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);
  return null;
}
