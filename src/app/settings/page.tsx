import Link from "next/link";
import { connection } from "next/server";
import { formatDay, formatTime } from "@/lib/dates";
import { dbPath } from "@/lib/db";
import { backupDir, lastBackup } from "@/lib/backup";
import { getSetting } from "@/modules/core/settings";
import { saveProfile } from "@/modules/core/actions";
import { reminders, subscriptionCount, vapidKeys } from "@/modules/push/server";
import { addReminder, deleteReminder, setReminderTime, toggleReminder } from "@/modules/push/actions";
import { leaveByMin } from "@/modules/morning/queries";
import { ChevronIcon, XIcon } from "@/components/icons";
import { PushManager } from "./PushManager";
import { Fold } from "@/components/Fold";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default async function SettingsPage() {
  await connection();
  const p = getSetting("profile");
  const list = reminders();
  const devices = subscriptionCount();
  const backup = lastBackup();

  return (
    <div className="space-y-5">
      {p.setupDone && (
        <Link href="/" className="btn-ghost -ml-3">
          <ChevronIcon dir="left" className="h-4 w-4" /> Today
        </Link>
      )}
      <header>
        <p className="eyebrow">{p.setupDone ? "Settings" : "Welcome to North"}</p>
        <h1 className="h1">{p.setupDone ? "Your bearings" : "Let's set your bearings"}</h1>
        {!p.setupDone && (
          <p className="muted mt-1">
            A few facts about your days. They stay on this laptop. For the first two weeks North only measures your mornings;
            nothing changes until you have real numbers.
          </p>
        )}
      </header>

      <form action={saveProfile} className="card space-y-3">
        <Field label="Your name" name="name" defaultValue={p.name} placeholder="So Vera knows what to call you" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Usual wake-up" name="wakeTime" type="time" defaultValue={p.wakeTime} />
          <Field label="Commute, door to desk (min)" name="commuteMin" type="number" defaultValue={String(p.commuteMin)} />
          <Field label="Work starts" name="workStart" type="time" defaultValue={p.workStart} />
          <Field label="Work ends" name="workEnd" type="time" defaultValue={p.workEnd} />
        </div>
        <fieldset>
          <legend className="label">Work days</legend>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d, i) => (
              <label key={i}>
                <input type="checkbox" name="workDays" value={i} defaultChecked={p.workDays.includes(String(i))} className="peer sr-only" />
                <span className="chip w-full cursor-pointer px-0 peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold-bright">
                  {d}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          label="Goal: arrive by"
          name="goalArrive"
          type="time"
          defaultValue={p.goalArrive}
          hint={p.setupDone ? `Leave-by works out to ${formatTime(leaveByMin())}.` : "Pick your first goal, not your dream. You can move it later."}
        />
        <button className="btn-gold w-full">{p.setupDone ? "Save" : "Start"}</button>
      </form>

      {p.setupDone && (
        <>
          <section className="card space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="h2">Reminders</p>
              <p className="text-xs text-ink-faint">
                {devices} device{devices === 1 ? "" : "s"}
              </p>
            </div>
            <PushManager publicKey={vapidKeys().publicKey} />
            <ul className="divide-y divide-night-700">
              {list.map((r) => (
                <li key={r.id} className="flex items-center gap-2 py-2">
                  <form action={toggleReminder.bind(null, r.id)}>
                    <button
                      aria-label={r.active ? "Turn off" : "Turn on"}
                      className={`h-6 w-10 rounded-full p-0.5 transition ${r.active ? "bg-gold" : "bg-night-700"}`}
                    >
                      <span className={`block h-5 w-5 rounded-full bg-night-950 transition ${r.active ? "translate-x-4" : ""}`} />
                    </button>
                  </form>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{r.title}</p>
                    <p className="text-xs text-ink-faint">
                      {r.kind === "leave_by"
                        ? `10 min before leave-by (${formatTime(leaveByMin() - 10)}), work days, once step two starts`
                        : r.days === "0123456"
                          ? "Every day"
                          : r.days.split("").map((d) => DAYS[Number(d)]).join(" ")}
                    </p>
                  </div>
                  {r.kind === "custom" && (
                    <>
                      <form action={setReminderTime.bind(null, r.id)} className="flex items-center gap-1">
                        <input type="time" name="time" defaultValue={r.time} className="input min-h-9 w-[6.5rem] px-2 text-sm" />
                        <button className="btn btn-sm">Set</button>
                      </form>
                      <form action={deleteReminder.bind(null, r.id)}>
                        <button className="btn-ghost btn-sm px-1" aria-label={`Delete ${r.title}`}>
                          <XIcon className="h-4 w-4" />
                        </button>
                      </form>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <Fold summaryClassName="text-sm text-gold" summary="+ Add a reminder">
              <form action={addReminder} className="mt-3 space-y-2">
                <input name="title" required placeholder="Reminder" className="input" />
                <input name="body" placeholder="Details (optional)" className="input" />
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d, i) => (
                    <label key={i}>
                      <input type="checkbox" name="days" value={i} defaultChecked className="peer sr-only" />
                      <span className="chip w-full cursor-pointer px-0 peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold-bright">
                        {d}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="time" name="time" required className="input" />
                  <button className="btn-gold shrink-0">Add</button>
                </div>
              </form>
            </Fold>
          </section>

          <section className="card space-y-1 text-sm">
            <p className="h2 mb-1">Your data</p>
            <p className="text-ink-muted">
              Stored on this laptop at <code className="break-all text-xs">{dbPath()}</code>
            </p>
            <p className="text-ink-muted">
              {backupDir()
                ? backup
                  ? `Last backup: ${formatDay(backup.date, { month: "short", day: "numeric" })}, to ${backupDir()}`
                  : `Backups go to ${backupDir()} nightly at 2 AM. None yet.`
                : "Backups aren't set up yet (NORTH_BACKUP_DIR in .env.local)."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" {...input} />
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}
