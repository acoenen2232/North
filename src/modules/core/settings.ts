import { get, run } from "@/lib/db";

// Personal details (times, routine) live here, in the local database, never in the repo.
export type Profile = {
  name: string;
  wakeTime: string; // "HH:MM"
  workStart: string;
  workEnd: string;
  workDays: string; // digits of weekdays (0 = Sunday)
  commuteMin: number; // door to desk
  goalArrive: string; // current goal arrival time
  setupDone: boolean;
};

export type MorningSettings = {
  /** "measure" = just record for the first weeks; "improve" = countdown + prep checklist active. */
  phase: "measure" | "improve";
  phaseStarted: string; // ISO date
  measureDays: number;
};

const defaults = {
  profile: {
    name: "",
    wakeTime: "06:30",
    workStart: "08:00",
    workEnd: "16:30",
    workDays: "12345",
    commuteMin: 10,
    goalArrive: "08:00",
    setupDone: false,
  } satisfies Profile,
  morning: {
    phase: "measure",
    phaseStarted: "",
    measureDays: 14,
  } satisfies MorningSettings,
};

type SettingsMap = { profile: Profile; morning: MorningSettings };

export function getSetting<K extends keyof SettingsMap>(key: K): SettingsMap[K] {
  const row = get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  const stored = row ? (JSON.parse(row.value) as Partial<SettingsMap[K]>) : {};
  return { ...defaults[key], ...stored } as SettingsMap[K];
}

export function setSetting<K extends keyof SettingsMap>(key: K, patch: Partial<SettingsMap[K]>) {
  const next = { ...getSetting(key), ...patch };
  run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    JSON.stringify(next),
  );
  return next;
}

/** Raw string values for internal things like VAPID keys. */
export function getRaw(key: string): string | undefined {
  return get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key)?.value;
}

export function setRaw(key: string, value: string) {
  run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}
