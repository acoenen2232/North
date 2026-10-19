import { connection } from "next/server";
import { formatDay, isoDate } from "@/lib/dates";
import { habitWeeks, triggerChoices, triggerStats, wentRight } from "@/modules/constellations/queries";
import { addHabit, archiveHabit, logBadHabit, saveWentRight, toggleHabitToday } from "@/modules/constellations/actions";
import { CheckIcon, XIcon } from "@/components/icons";
import { Fold } from "@/components/Fold";

export default async function ConstellationsPage() {
  await connection();
  const today = isoDate();
  const weeks = habitWeeks(today);
  const bad = triggerStats(today);
  const notes = wentRight();

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Habits</p>
        <h1 className="h1">Constellations</h1>
      </header>

      <section className="space-y-2">
        {weeks.map(({ habit, week, count, doneToday, todayLogId, streak }) => (
          <div key={habit.id} className={doneToday ? "card border-good/40" : "card"}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="h2">{habit.name}</p>
                {habit.description && <p className="text-xs text-ink-faint">{habit.description}</p>}
              </div>
              <form action={toggleHabitToday.bind(null, habit.id)}>
                <button
                  aria-label={doneToday ? "Undo today" : "Done today"}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 ${
                    doneToday ? "border-good bg-good text-night-950" : "border-night-600 text-ink-faint"
                  }`}
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                {week.map((d) => (
                  <span
                    key={d.date}
                    title={d.date}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                      d.done ? "bg-good/80 text-night-950" : d.date === today ? "border border-gold/60 text-gold" : "bg-night-800 text-ink-faint"
                    }`}
                  >
                    {formatDay(d.date, { weekday: "narrow" })}
                  </span>
                ))}
              </div>
              <p className="text-xs text-ink-faint">
                {count}/{habit.per_week} this week{streak > 1 ? ` · ${streak}-day run` : ""}
              </p>
            </div>
            {doneToday && todayLogId && (
              <form action={saveWentRight.bind(null, todayLogId)} className="mt-3 flex gap-2">
                <input name="went_right" placeholder="What made it work today?" className="input min-h-9 text-sm" />
                <button className="btn btn-sm">Save</button>
              </form>
            )}
          </div>
        ))}
      </section>

      {bad.length > 0 && (
        <section className="space-y-2">
          <p className="eyebrow px-1">Habits to break</p>
          {bad.map(({ habit, last30, top }) => (
            <div key={habit.id} className="card space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="h2">{habit.name}</p>
                <p className="text-xs text-ink-faint">{last30} in 30 days</p>
              </div>
              {top.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {top.map((t) => (
                    <span key={`${t.kind}${t.value}`} className="rounded-full bg-night-800 px-2.5 py-1 text-xs text-ink-muted">
                      {t.kind}: <span className="text-warn">{t.value}</span> ×{t.count}
                    </span>
                  ))}
                </div>
              )}
              <Fold summary="It happened" summaryClassName="btn w-full">
                <form action={logBadHabit.bind(null, habit.id)} className="mt-3 space-y-3">
                  <ChipGroup name="place" label="Where" options={triggerChoices.place} />
                  <ChipGroup name="mood" label="Feeling" options={triggerChoices.mood} />
                  <ChipGroup name="people" label="With" options={triggerChoices.people} />
                  <input name="note" placeholder="What set it off? (optional)" className="input" />
                  <button className="btn-gold w-full">Log it</button>
                  <p className="text-center text-xs text-ink-faint">No judgment. Just data.</p>
                </form>
              </Fold>
            </div>
          ))}
        </section>
      )}

      {notes.length > 0 && (
        <section className="card space-y-2">
          <p className="eyebrow">What&apos;s working</p>
          <ul className="space-y-1.5 text-sm">
            {notes.map((n) => (
              <li key={n.id}>
                <span className="text-ink-faint">{n.name}:</span> {n.went_right}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Fold className="card" summaryClassName="text-sm text-gold" summary="+ Add a habit">
        <form action={addHabit} className="mt-3 space-y-3">
          <input name="name" required placeholder="Habit name" className="input" />
          <div className="flex gap-2">
            <label className="flex-1">
              <input type="radio" name="kind" value="good" defaultChecked className="peer sr-only" />
              <span className="chip w-full peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold-bright">Build it</span>
            </label>
            <label className="flex-1">
              <input type="radio" name="kind" value="bad" className="peer sr-only" />
              <span className="chip w-full peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold-bright">Break it</span>
            </label>
          </div>
          <label className="block">
            <span className="label">Times per week (for habits you&apos;re building)</span>
            <input type="number" name="per_week" min={1} max={7} defaultValue={7} className="input" />
          </label>
          <input name="description" placeholder="Note (optional)" className="input" />
          <button className="btn-gold w-full">Add</button>
        </form>
      </Fold>

      <details className="px-1">
        <summary className="cursor-pointer list-none text-xs text-ink-faint">Remove a habit</summary>
        <ul className="mt-2 space-y-1">
          {[...weeks.map((w) => w.habit), ...bad.map((b) => b.habit)].map((h) => (
            <li key={h.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">{h.name}</span>
              <form action={archiveHabit.bind(null, h.id)}>
                <button className="btn-ghost btn-sm" aria-label={`Remove ${h.name}`}>
                  <XIcon className="h-4 w-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function ChipGroup({ name, label, options }: { name: string; label: string; options: readonly string[] }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <label key={o}>
            <input type="radio" name={name} value={o} className="peer sr-only" />
            <span className="chip cursor-pointer peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold-bright">{o}</span>
          </label>
        ))}
        <input name={`${name}_other`} placeholder="Other" className="input min-h-9 w-24 flex-1 text-sm" />
      </div>
    </fieldset>
  );
}
