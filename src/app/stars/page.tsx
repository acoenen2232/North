import Link from "next/link";
import { connection } from "next/server";
import { isoDate } from "@/lib/dates";
import { goals, openTodos, pendingStuck, recentlyDone } from "@/modules/stars/queries";
import { addStar, rateFix } from "@/modules/stars/actions";
import { fixFor } from "@/modules/stars/fixes";
import { StarRow } from "@/components/StarRow";
import { Fold } from "@/components/Fold";

export default async function StarsPage() {
  await connection();
  const today = isoDate();
  const goalList = goals();
  const todos = openTodos();
  const pending = pendingStuck();
  const done = recentlyDone(7, today);
  const loose = todos.filter((t) => !t.goal_id || !goalList.some((g) => g.id === t.goal_id));

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Goals &amp; to-dos</p>
        <h1 className="h1">Stars</h1>
      </header>

      {pending.map((p) => (
        <div key={p.id} className="card-glow space-y-2">
          <p className="text-sm">
            You tried <span className="text-gold">{fixFor(p.reason, p.fix)?.label ?? p.fix}</span> on &ldquo;{p.title}&rdquo;. Did it help?
          </p>
          <div className="flex gap-2">
            <form action={rateFix.bind(null, p.id, "helped")} className="flex-1">
              <button className="btn-gold w-full">It helped</button>
            </form>
            <form action={rateFix.bind(null, p.id, "didnt")} className="flex-1">
              <button className="btn w-full">Not really</button>
            </form>
          </div>
        </div>
      ))}

      <Fold
        className="card"
        summaryClassName="text-sm text-gold"
        summary="+ Add a star"
        defaultOpen={todos.length === 0 && goalList.length === 0}
      >
        <form action={addStar} className="mt-3 space-y-3">
          <input name="title" required placeholder="What do you want to get done?" className="input" />
          <div className="flex gap-2">
            <label className="flex-1">
              <input type="radio" name="kind" value="todo" defaultChecked className="peer sr-only" />
              <span className="chip w-full peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold-bright">To-do</span>
            </label>
            <label className="flex-1">
              <input type="radio" name="kind" value="goal" className="peer sr-only" />
              <span className="chip w-full peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold-bright">Goal</span>
            </label>
          </div>
          {goalList.length > 0 && (
            <select name="goal_id" className="input" defaultValue="">
              <option value="">No goal</option>
              {goalList.map((g) => (
                <option key={g.id} value={g.id}>
                  Toward: {g.title}
                </option>
              ))}
            </select>
          )}
          <input name="why" placeholder="Why does this matter? (optional)" className="input" />
          <div className="grid grid-cols-2 items-end gap-2">
            <label>
              <span className="label">Due</span>
              <input type="date" name="due_date" className="input" />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" name="today" className="h-5 w-5 accent-[#f2c46d]" /> Do it today
            </label>
          </div>
          <button className="btn-gold w-full">Add</button>
        </form>
      </Fold>

      {goalList.map((g) => {
        const steps = todos.filter((t) => t.goal_id === g.id);
        return (
          <section key={g.id} className="space-y-2">
            <Link href={`/stars/${g.id}`} className="block px-1">
              <p className="h2">{g.title}</p>
              {g.why && <p className="text-xs text-ink-faint">{g.why}</p>}
            </Link>
            {steps.length ? (
              <ul className="space-y-1.5">
                {steps.map((s) => (
                  <StarRow key={s.id} star={s} today={today} />
                ))}
              </ul>
            ) : (
              <p className="px-1 text-xs text-ink-faint">No next step yet. A goal without a next step is a wish.</p>
            )}
          </section>
        );
      })}

      {loose.length > 0 && (
        <section className="space-y-2">
          <p className="eyebrow px-1">To-dos</p>
          <ul className="space-y-1.5">
            {loose.map((s) => (
              <StarRow key={s.id} star={s} today={today} />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className="space-y-2">
          <p className="eyebrow px-1">Done this week · {done.length}</p>
          <ul className="space-y-1.5">
            {done.map((s) => (
              <StarRow key={s.id} star={s} today={today} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
