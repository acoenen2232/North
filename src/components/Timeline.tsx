"use client";

import type { EventRow } from "@/modules/heading/queries";
import { categoryOf } from "@/modules/heading/categories";
import { removeEvent, toggleEventDone } from "@/modules/heading/actions";
import { CheckIcon, NorthStar } from "./icons";
import { clock, fmtClock, useNow } from "./useNow";

export function Timeline({ events, date, isToday }: { events: EventRow[]; date: string; isToday: boolean }) {
  const now = useNow(30_000);
  const nowMin = isToday && now ? clock(now) : null;

  if (events.length === 0) {
    return <p className="muted px-1 py-4">Nothing charted yet. Add a block below, or ask Vera to plan the day.</p>;
  }

  return (
    <ol className="space-y-2">
      {events.map((e) => {
        const cat = categoryOf(e.category);
        const current = nowMin !== null && e.start_min !== null && e.end_min !== null && nowMin >= e.start_min && nowMin < e.end_min;
        const past = nowMin !== null && e.end_min !== null && nowMin >= e.end_min;
        return (
          <li
            key={e.id}
            className={`flex items-stretch gap-3 rounded-xl border-l-4 ${cat.bar} ${
              current ? "bg-gold/10 ring-1 ring-gold/50" : "bg-night-850/70"
            } py-2.5 pl-3 pr-2 ${past && !e.done ? "opacity-60" : ""}`}
          >
            <div className="w-16 shrink-0 pt-0.5 font-mono text-xs leading-5 text-ink-muted">
              {e.start_min !== null ? (
                <>
                  {fmtClock(e.start_min)}
                  {e.end_min !== null && <span className="block text-ink-faint">{fmtClock(e.end_min)}</span>}
                </>
              ) : (
                <span className="text-ink-faint">Anytime</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${e.done ? "text-ink-faint line-through" : ""}`}>
                {e.title}
                {e.source === "vera" && <NorthStar className="ml-1.5 inline h-3 w-3 text-accent" />}
              </p>
              <p className="text-xs text-ink-faint">
                {cat.label}
                {e.repeat !== "none" && ` · ${e.repeat === "weekdays" ? "weekdays" : e.repeat}`}
                {current && <span className="text-accent"> · now</span>}
              </p>
              {e.notes && <p className="mt-1 text-xs text-ink-muted">{e.notes}</p>}
            </div>
            <div className="flex items-center gap-1">
              <form action={toggleEventDone.bind(null, e.id, date)}>
                <button
                  aria-label={e.done ? "Mark not done" : "Mark done"}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    e.done ? "border-gold bg-gold text-on-accent" : "border-night-600 text-transparent"
                  }`}
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
              </form>
              <details className="relative">
                <summary className="flex h-8 w-6 cursor-pointer list-none items-center justify-center text-ink-faint">⋯</summary>
                <div className="absolute right-0 z-10 mt-1 w-40 space-y-1 rounded-xl border border-night-600 bg-night-800 p-1.5 shadow-xl">
                  {e.repeat !== "none" && (
                    <form action={removeEvent.bind(null, e.id, date, "one")}>
                      <button className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-night-700">Skip this day</button>
                    </form>
                  )}
                  <form action={removeEvent.bind(null, e.id, date, "all")}>
                    <button className="w-full rounded-lg px-2 py-2 text-left text-sm text-bad hover:bg-night-700">
                      {e.repeat !== "none" ? "Stop repeating" : "Delete"}
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
