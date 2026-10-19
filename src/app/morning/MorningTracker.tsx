"use client";

import { useTransition } from "react";
import { arrived, leaveNow, startTask, stopTask, wakeUp } from "@/modules/morning/actions";
import type { MorningDay, MorningTask, Segment } from "@/modules/morning/queries";
import { clock, fmtClock, fmtTimer, useNow } from "@/components/useNow";

type Props = {
  tasks: MorningTask[];
  day: MorningDay | null;
  segments: Segment[];
  leaveBy: number;
  goalArrive: number;
  showCountdown: boolean;
};

const minsOf = (ts: string) => clock(new Date(ts));
const elapsed = (from: string, to: Date) => (to.getTime() - new Date(from).getTime()) / 60_000;

export function MorningTracker({ tasks, day, segments, leaveBy, goalArrive, showCountdown }: Props) {
  const now = useNow();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<void>) => start(() => fn());

  const open = segments.find((s) => !s.ended_at);
  const woke = day?.woke_at ?? null;
  const left = day?.left_at ?? null;
  const arrivedAt = day?.arrived_at ?? null;

  const taskTotal = (taskId: number) =>
    segments
      .filter((s) => s.task_id === taskId)
      .reduce((sum, s) => sum + (s.ended_at ? elapsed(s.started_at, new Date(s.ended_at)) : now ? elapsed(s.started_at, now) : 0), 0);

  // Countdown to leave-by.
  const nowMin = now ? clock(now) : null;
  const toLeave = nowMin !== null ? leaveBy - nowMin : null;
  const countdownTone =
    toLeave === null ? "text-gold" : toLeave > 15 ? "text-gold" : toLeave > 5 ? "text-warn" : "text-bad";

  return (
    <div className="space-y-4">
      {showCountdown && !left && (
        <div className="card-glow text-center">
          <p className="eyebrow">Leave by {fmtClock(leaveBy)}</p>
          <p className={`mt-1 font-mono text-5xl font-semibold tabular-nums ${countdownTone}`}>
            {toLeave === null ? "--:--" : toLeave >= 0 ? fmtTimer(toLeave) : `+${fmtTimer(-toLeave)}`}
          </p>
          <p className="muted mt-1">
            {toLeave === null ? "" : toLeave >= 0 ? "until you walk out the door" : "past leave-by. Go now."}
          </p>
        </div>
      )}

      {!woke && (
        <button className="btn-gold w-full py-6 text-lg" disabled={pending} onClick={() => act(wakeUp)}>
          I&apos;m up
        </button>
      )}

      {woke && !left && (
        <>
          <div className="flex items-baseline justify-between px-1">
            <p className="muted">Up at {fmtClock(minsOf(woke))}</p>
            {now && <p className="muted tabular-nums">{fmtTimer(elapsed(woke, now))} since waking</p>}
          </div>
          <ul className="space-y-2">
            {tasks.map((t) => {
              const running = open?.task_id === t.id;
              const total = taskTotal(t.id);
              return (
                <li key={t.id}>
                  <button
                    disabled={pending}
                    onClick={() => act(() => (running ? stopTask() : startTask(t.id)))}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition active:scale-[0.99] ${
                      running
                        ? "border-gold bg-gold/10 shadow-[0_0_20px_-6px_rgb(242_196_109/0.6)]"
                        : "border-night-700 bg-night-850/80"
                    }`}
                  >
                    <span>
                      <span className="block text-base font-medium">{t.name}</span>
                      <span className="text-xs text-ink-faint">
                        {running ? "Running · tap to stop" : total > 0 ? "Tap to resume" : "Tap to start"}
                      </span>
                    </span>
                    <span className={`font-mono text-lg tabular-nums ${running ? "text-gold" : "text-ink-muted"}`}>
                      {total > 0 || running ? fmtTimer(total) : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="btn-gold w-full py-5 text-base" disabled={pending} onClick={() => act(leaveNow)}>
            Leaving now
          </button>
        </>
      )}

      {left && (
        <div className="card space-y-3">
          <Row label="Up" value={woke ? fmtClock(minsOf(woke)) : "—"} />
          <Row
            label="Left"
            value={fmtClock(minsOf(left))}
            note={showCountdown ? diffNote(minsOf(left) - leaveBy, "leave-by") : undefined}
          />
          {arrivedAt ? (
            <Row label="Arrived" value={fmtClock(minsOf(arrivedAt))} note={diffNote(minsOf(arrivedAt) - goalArrive, "goal")} />
          ) : (
            <button className="btn w-full" disabled={pending} onClick={() => act(arrived)}>
              I&apos;ve arrived {now && <span className="text-ink-faint">· {fmtTimer(elapsed(left, now))} on the road</span>}
            </button>
          )}
          {woke && (
            <div className="border-t border-night-700 pt-3">
              <p className="eyebrow mb-2">Where the time went</p>
              {tasks
                .map((t) => ({ t, m: taskTotal(t.id) }))
                .filter((x) => x.m > 0)
                .map(({ t, m }) => (
                  <Row key={t.id} label={t.name} value={`${Math.round(m)} min`} />
                ))}
              <Row
                label="In between"
                value={`${Math.max(0, Math.round(elapsed(woke, new Date(left)) - tasks.reduce((a, t) => a + taskTotal(t.id), 0)))} min`}
                muted
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, note, muted }: { label: string; value: string; note?: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className={muted ? "text-sm text-ink-faint" : "text-sm text-ink-muted"}>{label}</span>
      <span className="text-right">
        <span className="font-mono tabular-nums">{value}</span>
        {note && <span className="ml-2 text-xs text-ink-faint">{note}</span>}
      </span>
    </div>
  );
}

function diffNote(diff: number, what: string) {
  const d = Math.round(diff);
  if (d === 0) return `right on ${what}`;
  return d < 0 ? `${-d} min before ${what}` : `${d} min after ${what}`;
}
