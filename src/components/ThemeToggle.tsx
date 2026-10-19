"use client";

import { setThemePref, useTheme, useThemePref, type ThemePref } from "./theme";
import { MoonIcon, SunIcon } from "./icons";

/** One-tap switch between Night and Day. */
export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      className="btn-ghost px-2"
      aria-label={next === "light" ? "Switch to Day theme" : "Switch to Night theme"}
      onClick={() => setThemePref(next)}
    >
      {theme === "light" ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
    </button>
  );
}

const options: { value: ThemePref; label: string }[] = [
  { value: "dark", label: "Night" },
  { value: "light", label: "Day" },
  { value: "auto", label: "Match phone" },
];

/** Night / Day / Match phone, for Settings. */
export function ThemePicker() {
  const pref = useThemePref();
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button key={o.value} className="chip w-full" data-on={pref === o.value} onClick={() => setThemePref(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
