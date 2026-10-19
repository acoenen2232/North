import { connection } from "next/server";
import { addDays, formatDay, formatDuration, formatTime, isoDate, minutesOfDay, parseHHMM, toHHMM, minutesFromTimestamp } from "@/lib/dates";
import { getSetting } from "@/modules/core/settings";
import {
  leaveByMin,
  morningDay,
  morningPhase,
  morningStats,
  morningTasks,
  prepChecks,
  prepItems,
} from "@/modules/morning/queries";
import {
  addMorningTask,
  addPrepItem,
  archiveMorningTask,
  archivePrepItem,
  fixTimes,
  setMorningPhase,
  togglePrep,
} from "@/modules/morning/actions";
import { MorningTracker } from "./MorningTracker";
import { CheckIcon, XIcon } from "@/components/icons";

export default async function MorningPage() {
  await connection();
  const today = isoDate();
  const profile = getSetting("profile");
  const phase = morningPhase();
  const tasks = morningTasks();
  const { day, segments } = morningDay(today);
  const leaveBy = leaveByMin();
  const goalArrive = parseHHMM(profile.goalArrive);
  const improving = phase.phase === "improve";
  const items = prepItems();
  const tonight = prepChecks(today);
  const lastNight = prepChecks(addDays(today, -1));
  const stats = morningStats(14);
  const evening = minutesOfDay() >= 15 * 60;

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">{formatDay(today)}</p>
        <h1 className="h1">Morning</h1>
      </header>

      <div className="card flex items-center justify-between gap-3">
        {improving ? (
          <p className="text-sm">
            <span className="text-gold">Goal: arrive {formatTime(goalArrive)}.</span>{" "}
            <span className="text-ink-muted">Leave by {formatTime(leaveBy)}.</span>
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            <span className="text-gold">Measuring · day {Math.min(phase.day, phase.measureDays)} of {phase.measureDays}.</span>{" "}
            No changes yet. Just tap.
          </p>
        )}
      </div>

      {phase.readyToImprove && (
        <div className="card-glow space-y-3">
          <p className="h2">Two weeks of data. Time for step two.</p>
          <p className="muted">
            Turn on the evening prep checklist and the live leave-by countdown. One change at a time.
          </p>
          <form action={setMorningPhase.bind(null, "improve")}>
            <button className="btn-gold w-full">Start step two</button>
          </form>
        </div>
      )}

      {improving && evening && (
        <PrepList title="Tonight's prep" items={items} checked={tonight} date={today} />
      )}

      <MorningTracker
        tasks={tasks}
        day={day}
        segments={segments}
        leaveBy={leaveBy}
        goalArrive={goalArrive}
        showCountdown={improving}
      />

      {improving && !evening && items.length > 0 && (
        <p className="px-1 text-sm text-ink-faint">
          Last night&apos;s prep: {lastNight.length} of {items.length}
          {lastNight.length === items.length ? ". Nice." : ""}
        </p>
      )}

      {improving && !evening && <PrepList title="Tonight's prep" items={items} checked={tonight} date={today} />}

      <section className="card space-y-3">
        <p className="eyebrow">Last 14 days</p>
        {stats.mornings === 0 ? (
          <p className="muted">No mornings tracked yet. Tomorrow, tap &ldquo;I&apos;m up&rdquo; and go.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Up" value={stats.avgWake} />
              <Stat label="Leave" value={stats.avgLeft} />
              <Stat label="Arrive" value={stats.avgArrive} />
            </div>
            <p className="text-sm text-ink-muted">
              On time for {formatTime(goalArrive)}:{" "}
              <span className="text-ink">
                {stats.onTime} of {stats.withArrival}
              </span>{" "}
              mornings
            </p>
            {stats.avgByTask.length > 0 && (
              <ul className="space-y-1 border-t border-night-700 pt-3 text-sm">
                {stats.avgByTask.map((t) => (
                  <li key={t.taskId} className="flex justify-between">
                    <span className="text-ink-muted">{t.name}</span>
                    <span className="font-mono">{formatDuration(t.avg)}</span>
                  </li>
                ))}
                {stats.avgUntracked !== null && (
                  <li className="flex justify-between">
                    <span className="text-ink-faint">In between</span>
                    <span className="font-mono text-ink-faint">{formatDuration(stats.avgUntracked)}</span>
                  </li>
                )}
              </ul>
            )}
            {stats.prepEffect.fullDays > 0 && stats.prepEffect.otherDays > 0 && (
              <p className="border-t border-night-700 pt-3 text-sm text-ink-muted">
                After full prep you arrive around{" "}
                <span className="text-gold">{formatTime(stats.prepEffect.fullPrep!)}</span>; otherwise{" "}
                <span className="text-ink">{formatTime(stats.prepEffect.noPrep!)}</span>.
              </p>
            )}
          </>
        )}
      </section>

      <details className="card group">
        <summary className="cursor-pointer list-none text-sm text-ink-muted">Fix today&apos;s times</summary>
        <form action={fixTimes} className="mt-3 grid grid-cols-3 gap-2">
          <input type="hidden" name="date" value={today} />
          <TimeField name="woke" label="Up" ts={day?.woke_at} />
          <TimeField name="left" label="Left" ts={day?.left_at} />
          <TimeField name="arrived" label="Arrived" ts={day?.arrived_at} />
          <button className="btn col-span-3">Save times</button>
        </form>
      </details>

      <details className="card">
        <summary className="cursor-pointer list-none text-sm text-ink-muted">Edit morning tasks &amp; prep list</summary>
        <div className="mt-3 space-y-4">
          <EditList items={tasks} archive={archiveMorningTask} add={addMorningTask} placeholder="Add a morning task" />
          <EditList items={items} archive={archivePrepItem} add={addPrepItem} placeholder="Add a prep item" />
          {improving ? (
            <form action={setMorningPhase.bind(null, "measure")}>
              <button className="btn-ghost btn-sm">Go back to measuring only</button>
            </form>
          ) : (
            !phase.readyToImprove && (
              <form action={setMorningPhase.bind(null, "improve")}>
                <button className="btn-ghost btn-sm">Skip ahead to step two</button>
              </form>
            )
          )}
        </div>
      </details>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl bg-night-950/50 py-2">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="font-mono text-sm">{value === null ? "—" : formatTime(value)}</p>
    </div>
  );
}

function TimeField({ name, label, ts }: { name: string; label: string; ts?: string | null }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input type="time" name={name} defaultValue={ts ? toHHMM(minutesFromTimestamp(ts)) : ""} className="input px-2" />
    </label>
  );
}

function PrepList({
  title,
  items,
  checked,
  date,
}: {
  title: string;
  items: { id: number; name: string }[];
  checked: number[];
  date: string;
}) {
  const done = items.every((i) => checked.includes(i.id));
  return (
    <section className={done ? "card" : "card-glow"}>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="eyebrow">{title}</p>
        <p className="text-xs text-ink-faint">
          {checked.length}/{items.length}
        </p>
      </div>
      <ul className="space-y-1.5">
        {items.map((i) => {
          const on = checked.includes(i.id);
          return (
            <li key={i.id}>
              <form action={togglePrep.bind(null, i.id, date)}>
                <button className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      on ? "border-gold bg-gold text-night-950" : "border-night-600"
                    }`}
                  >
                    {on && <CheckIcon className="h-4 w-4" />}
                  </span>
                  <span className={on ? "text-ink-faint line-through" : ""}>{i.name}</span>
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EditList({
  items,
  archive,
  add,
  placeholder,
}: {
  items: { id: number; name: string }[];
  archive: (id: number) => Promise<void>;
  add: (fd: FormData) => Promise<void>;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.id} className="flex items-center justify-between text-sm">
            <span>{i.name}</span>
            <form action={archive.bind(null, i.id)}>
              <button className="btn-ghost btn-sm" aria-label={`Remove ${i.name}`}>
                <XIcon className="h-4 w-4" />
              </button>
            </form>
          </li>
        ))}
      </ul>
      <form action={add} className="flex gap-2">
        <input name="name" placeholder={placeholder} className="input" />
        <button className="btn">Add</button>
      </form>
    </div>
  );
}
