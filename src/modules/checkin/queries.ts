import { all, get } from "@/lib/db";

export type Checkin = {
  date: string;
  mood: number | null;
  energy: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  note: string | null;
  updated_at: string;
};

export function checkinFor(date: string): Checkin | null {
  return get<Checkin>("SELECT * FROM checkins WHERE date = ?", date) ?? null;
}

export function checkinsBetween(from: string, to: string): Checkin[] {
  return all<Checkin>("SELECT * FROM checkins WHERE date BETWEEN ? AND ? ORDER BY date", from, to);
}

export const moodLabels = ["Low", "Meh", "Okay", "Good", "Great"];
export const energyLabels = ["Drained", "Low", "Steady", "Good", "Charged"];
export const sleepQualityLabels = ["Awful", "Poor", "Fine", "Good", "Deep"];
