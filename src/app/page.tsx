import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { formatDay, formatTime, isoDate, minutesOfDay } from "@/lib/dates";
import { getSetting } from "@/modules/core/settings";
import { eventsOn } from "@/modules/heading/queries";
import { checkinFor } from "@/modules/checkin/queries";
import { habitWeeks } from "@/modules/constellations/queries";
import { star, todayStars, type Star } from "@/modules/stars/queries";
import { dailyPlan } from "@/modules/vera/queries";
import { veraConnected } from "@/modules/vera/coach";
import { leaveByMin, morningDay, morningPhase, prepChecks, prepItems } from "@/modules/morning/queries";
import { Timeline } from "@/components/Timeline";
import { AddEventForm } from "@/components/AddEventForm";
import { CheckinCard } from "@/components/CheckinCard";
import { HabitTaps } from "@/components/HabitTaps";
import { StarRow } from "@/components/StarRow";
import { CalendarIcon, ChevronIcon, GearIcon, NorthStar } from "@/components/icons";

export default async function TodayPage() {
  await connection();
  const profile = getSetting("profile");
  if (!profile.setupDone) redirect("/settings");

  const today = isoDate();
  const now = minutesOfDay();
  const plan = dailyPlan(today);
  const phase = morningPhase();
  const { day } = morningDay(today);
  const improving = phase.phase === "improve";
  const prepTotal = prepItems().length;
  const prepDone = prepChecks(today).length;

  // Today's stars: planned/due, plus Vera's focus picks.
  const stars = new Map<number, Star>(todayStars(today).map((s) => [s.id, s]));
  for (const id of plan?.content.focus_star_ids ?? []) {
    const s = star(id);
    if (s && s.status === "open") stars.set(id, s);
  }

  const hour = Math.floor(now / 60);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{formatDay(today)}</p>
          <h1 className="h1">
            {greeting}
            {profile.name ? `, ${profile.name}` : ""}
          </h1>
        </div>
        <div className="flex gap-1">
          <Link href="/calendar" className="btn-ghost px-2" aria-label="Calendar">
            <CalendarIcon className="h-5 w-5" />
          </Link>
          <Link href="/settings" className="btn-ghost px-2" aria-label="Settings">
            <GearIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {plan ? (
        <Link href="/vera" className="card flex gap-3">
          <NorthStar className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="text-sm leading-relaxed">{plan.content.note}</p>
        </Link>
      ) : veraConnected() ? (
        <Link href="/vera" className="card flex items-center justify-between text-sm text-gold">
          <span className="flex items-center gap-2">
            <NorthStar className="h-4 w-4" /> Ask Vera to chart today
          </span>
          <ChevronIcon className="h-4 w-4" />
        </Link>
      ) : null}

      {now < 11 * 60 && !day?.left_at && profile.workDays.includes(String(new Date().getDay())) && (
        <Link href="/morning" className="card-glow flex items-center justify-between">
          <span>
            <span className="block font-medium">Morning mode</span>
            <span className="text-sm text-ink-muted">
              {improving ? `Leave by ${formatTime(leaveByMin())}` : day?.woke_at ? "Tracking. Tap your tasks." : "Tap “I’m up” to start"}
            </span>
          </span>
          <ChevronIcon className="h-5 w-5 text-gold" />
        </Link>
      )}

      {improving && now >= 18 * 60 && prepDone < prepTotal && (
        <Link href="/morning" className="card-glow flex items-center justify-between">
          <span>
            <span className="block font-medium">Evening prep</span>
            <span className="text-sm text-ink-muted">
              {prepDone} of {prepTotal} done. Future you is counting on it.
            </span>
          </span>
          <ChevronIcon className="h-5 w-5 text-gold" />
        </Link>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <p className="eyebrow">Today&apos;s Heading</p>
          <Link href={`/day/${today}`} className="text-xs text-ink-faint">
            Full day
          </Link>
        </div>
        <Timeline events={eventsOn(today)} date={today} isToday />
        <AddEventForm date={today} />
      </section>

      {stars.size > 0 && (
        <section className="space-y-2">
          <p className="eyebrow px-1">Stars for today</p>
          <ul className="space-y-1.5">
            {[...stars.values()].slice(0, 5).map((s) => (
              <StarRow key={s.id} star={s} today={today} />
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <p className="eyebrow px-1">Constellations</p>
        <HabitTaps weeks={habitWeeks(today)} />
      </section>

      <CheckinCard date={today} checkin={checkinFor(today)} />
    </div>
  );
}
