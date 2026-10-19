import type { HabitWeek } from "@/modules/constellations/queries";
import { toggleHabitToday } from "@/modules/constellations/actions";
import { CheckIcon } from "./icons";

/** One-tap habit logging for today. */
export function HabitTaps({ weeks }: { weeks: HabitWeek[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {weeks.map(({ habit, doneToday }) => (
        <form key={habit.id} action={toggleHabitToday.bind(null, habit.id)}>
          <button
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition active:scale-[0.98] ${
              doneToday ? "border-good/60 bg-good/10 text-good" : "border-night-700 bg-night-850/80 text-ink-muted"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                doneToday ? "border-good bg-good text-night-950" : "border-night-600"
              }`}
            >
              {doneToday && <CheckIcon className="h-3.5 w-3.5" />}
            </span>
            <span className="truncate">{habit.name}</span>
          </button>
        </form>
      ))}
    </div>
  );
}
