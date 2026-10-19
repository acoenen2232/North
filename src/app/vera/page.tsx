import Link from "next/link";
import { connection } from "next/server";
import { formatDay, formatTime, isoDate, parseHHMM, weekStart } from "@/lib/dates";
import { bearingsFor, dailyPlan, pastBearings, spendThisMonth } from "@/modules/vera/queries";
import { veraConnected, veraModels } from "@/modules/vera/coach";
import { acceptDailyPlan, generateBearings, generateDailyPlan } from "@/modules/vera/actions";
import { star } from "@/modules/stars/queries";
import { categoryOf } from "@/modules/heading/categories";
import { VeraButton } from "@/components/VeraButton";
import { ChevronIcon, NorthStar } from "@/components/icons";

export default async function VeraPage() {
  await connection();
  const today = isoDate();
  const connected = veraConnected();
  const plan = dailyPlan(today);
  const week = bearingsFor(weekStart(today));
  const history = pastBearings(6).filter((b) => b.week_start !== weekStart(today));
  const spend = spendThisMonth();

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Your coach</p>
          <h1 className="h1">Vera</h1>
        </div>
        <Link href="/vera/true-north" className="btn btn-sm">
          <NorthStar className="h-3.5 w-3.5 text-accent" /> True North
        </Link>
      </header>

      {!connected && (
        <div className="card-glow space-y-2">
          <p className="h2">Vera isn&apos;t connected yet</p>
          <p className="muted">
            Everything else works without her. To turn Vera on, add your Claude API key to the file <code>.env.local</code> in the
            North folder (<code>ANTHROPIC_API_KEY=…</code>) and restart North. Claude Code can walk you through it.
          </p>
        </div>
      )}

      {(plan || connected) && (
      <section className="space-y-3">
        <p className="eyebrow px-1">Today&apos;s plan</p>
        {plan ? (
          <div className="card space-y-3">
            <p className="text-base leading-relaxed">{plan.content.note}</p>
            {plan.content.focus_star_ids.length > 0 && (
              <div>
                <p className="label">Focus</p>
                <ul className="space-y-1 text-sm">
                  {plan.content.focus_star_ids.map((id) => {
                    const s = star(id);
                    return s ? (
                      <li key={id}>
                        <Link href={`/stars/${id}`} className="text-accent-bright">
                          ★ {s.title}
                        </Link>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
            {plan.content.blocks.length > 0 && (
              <ul className="space-y-1.5">
                {plan.content.blocks.map((b, i) => (
                  <li key={i} className={`rounded-lg border-l-4 ${categoryOf(b.category).bar} bg-night-950/50 px-3 py-2`}>
                    <p className="text-sm">
                      <span className="font-mono text-xs text-ink-muted">
                        {formatTime(parseHHMM(b.start))}–{formatTime(parseHHMM(b.end))}
                      </span>{" "}
                      {b.title}
                    </p>
                    <p className="text-xs text-ink-faint">{b.why}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-warn">Watch out: {plan.content.watch_out}</p>
            <div className="grid grid-cols-2 gap-2">
              <form action={acceptDailyPlan.bind(null, today)}>
                <button className="btn-gold w-full" disabled={plan.content.blocks.length === 0}>
                  {plan.accepted_at ? "On your day ✓" : "Put it on my day"}
                </button>
              </form>
              {connected && <VeraButton action={generateDailyPlan} label="Re-plan" pendingLabel="Thinking…" variant="plain" />}
            </div>
          </div>
        ) : connected ? (
          <div className="card space-y-3">
            <p className="muted">Vera looks at your calendar, Stars, habits and the last week, then charts the rest of today.</p>
            <VeraButton action={generateDailyPlan} label="Plan my day" pendingLabel="Vera is planning…" />
          </div>
        ) : null}
      </section>
      )}

      {(week || connected || history.length > 0) && (
      <section className="space-y-3">
        <p className="eyebrow px-1">Bearings · weekly review</p>
        {week ? <BearingsCard content={week.content} /> : null}
        {connected && (
          <VeraButton
            action={generateBearings}
            label={week ? "Re-run this week's Bearings" : "Take your Bearings"}
            pendingLabel="Vera is reviewing your week (this can take a minute)…"
            variant={week ? "plain" : "gold"}
          />
        )}
        {history.length > 0 && (
          <details className="card">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-ink-muted">
              Past weeks <ChevronIcon className="h-4 w-4" />
            </summary>
            <div className="mt-3 space-y-4">
              {history.map((b) => (
                <div key={b.week_start}>
                  <p className="label">Week of {formatDay(b.week_start, { month: "short", day: "numeric" })}</p>
                  <p className="text-sm">{b.content.headline}</p>
                  <p className="text-xs text-accent">Change: {b.content.one_change.what}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>
      )}

      {connected && (
        <p className="px-1 text-center text-xs text-ink-faint">
          This month: {spend.calls} Vera calls, about ${spend.dollars.toFixed(2)}. Daily plans use {veraModels.daily}; Bearings use{" "}
          {veraModels.weekly}.
        </p>
      )}
    </div>
  );
}

function BearingsCard({ content }: { content: NonNullable<ReturnType<typeof bearingsFor>>["content"] }) {
  return (
    <div className="card space-y-4">
      <p className="text-lg font-semibold leading-snug">{content.headline}</p>
      <List title="Wins" items={content.wins} tone="text-good" />
      <List title="Patterns" items={content.patterns} tone="text-ink" />
      <List title="Drift" items={content.drift} tone="text-warn" />
      <div className="card-glow space-y-1">
        <p className="eyebrow text-accent">One change for next week</p>
        <p className="font-medium">{content.one_change.what}</p>
        <p className="text-sm text-ink-muted">{content.one_change.why}</p>
        <p className="text-sm">
          <span className="text-ink-faint">First step:</span> {content.one_change.how}
        </p>
      </div>
      {content.true_north_updates.length > 0 && (
        <p className="text-xs text-ink-faint">Vera added {content.true_north_updates.length} line(s) to your True North.</p>
      )}
    </div>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="label">{title}</p>
      <ul className="space-y-1.5 text-sm">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span className={tone}>•</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
