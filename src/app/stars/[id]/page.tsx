import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { formatDay } from "@/lib/dates";
import { goals, rankedFixes, star, stuckLogsFor } from "@/modules/stars/queries";
import { completeStar, dropStar, planStarToday, tryFix, updateStar } from "@/modules/stars/actions";
import { fixFor, reasonKeys, reasons, type Reason } from "@/modules/stars/fixes";
import { ChevronIcon } from "@/components/icons";

export default async function StarPage({ params, searchParams }: PageProps<"/stars/[id]">) {
  await connection();
  const { id } = await params;
  const { reason } = await searchParams;
  const s = star(Number(id));
  if (!s) notFound();
  const goalList = goals().filter((g) => g.id !== s.id);
  const logs = stuckLogsFor(s.id);
  const chosen = typeof reason === "string" && reasonKeys.includes(reason as Reason) ? (reason as Reason) : null;
  const ranked = chosen ? rankedFixes(chosen) : [];

  return (
    <div className="space-y-5">
      <Link href="/stars" className="btn-ghost -ml-3">
        <ChevronIcon dir="left" className="h-4 w-4" /> Stars
      </Link>

      <header>
        <p className="eyebrow">{s.kind === "goal" ? "Goal" : "To-do"}</p>
        <h1 className={`h1 ${s.status === "done" ? "text-ink-faint line-through" : ""}`}>{s.title}</h1>
        {s.why && <p className="muted mt-1">{s.why}</p>}
      </header>

      {s.status === "open" && (
        <div className="grid grid-cols-2 gap-2">
          <form action={completeStar.bind(null, s.id)}>
            <button className="btn-gold w-full">Done</button>
          </form>
          <form action={planStarToday.bind(null, s.id)}>
            <button className="btn w-full">Do it today</button>
          </form>
        </div>
      )}

      {s.status === "open" && (
        <section className="card space-y-3">
          <p className="h2">Why am I putting this off?</p>
          <div className="flex flex-wrap gap-2">
            {reasonKeys.map((r) => (
              <Link key={r} href={`/stars/${s.id}?reason=${r}`} className="chip" data-on={chosen === r} scroll={false}>
                {reasons[r].label}
              </Link>
            ))}
          </div>
          {chosen && (
            <div className="space-y-2 pt-1">
              <p className="text-sm text-ink-muted">&ldquo;{reasons[chosen].prompt}&rdquo; Try one:</p>
              {ranked.map((f, i) => (
                <form
                  key={f.key}
                  action={tryFix.bind(null, s.id, chosen, f.key)}
                  className={`space-y-2 rounded-xl border p-3 ${i === 0 ? "border-gold/50 bg-gold/5" : "border-night-700"}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{f.label}</p>
                    {f.tried > 0 && (
                      <p className="shrink-0 text-xs text-ink-faint">
                        helped {f.helped}/{f.tried}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted">{f.how}</p>
                  {f.key === "split_3" &&
                    [1, 2, 3].map((n) => <input key={n} name={`step${n}`} placeholder={`Step ${n}`} className="input" />)}
                  {f.key === "next_action" && <input name="next_action" placeholder="The next physical action is…" className="input" />}
                  <button className={i === 0 ? "btn-gold btn-sm" : "btn btn-sm"}>Try this</button>
                </form>
              ))}
            </div>
          )}
        </section>
      )}

      <details className="card">
        <summary className="cursor-pointer list-none text-sm text-ink-muted">Edit</summary>
        <form action={updateStar.bind(null, s.id)} className="mt-3 space-y-3">
          <input name="title" defaultValue={s.title} required className="input" />
          <input name="why" defaultValue={s.why ?? ""} placeholder="Why it matters" className="input" />
          {s.kind === "todo" && (
            <select name="goal_id" defaultValue={s.goal_id ?? ""} className="input">
              <option value="">No goal</option>
              {goalList.map((g) => (
                <option key={g.id} value={g.id}>
                  Toward: {g.title}
                </option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="label">Do on</span>
              <input type="date" name="planned_date" defaultValue={s.planned_date ?? ""} className="input" />
            </label>
            <label>
              <span className="label">Due</span>
              <input type="date" name="due_date" defaultValue={s.due_date ?? ""} className="input" />
            </label>
          </div>
          <button className="btn w-full">Save</button>
        </form>
        <form action={dropStar.bind(null, s.id)} className="mt-2">
          <button className="btn-ghost btn-sm text-bad">Let it go (drop)</button>
        </form>
      </details>

      {logs.length > 0 && (
        <section className="space-y-2">
          <p className="eyebrow px-1">Stuck history</p>
          <ul className="space-y-1.5 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex justify-between gap-2 rounded-xl bg-night-850/70 px-3 py-2">
                <span>
                  {reasons[l.reason as Reason]?.label} → {fixFor(l.reason, l.fix)?.label ?? l.fix}
                </span>
                <span className={l.outcome === "helped" ? "text-good" : l.outcome === "didnt" ? "text-ink-faint" : "text-accent"}>
                  {l.outcome === "helped" ? "helped" : l.outcome === "didnt" ? "didn't" : "trying"}
                </span>
              </li>
            ))}
          </ul>
          <p className="px-1 text-xs text-ink-faint">Added {formatDay(s.created_at.slice(0, 10), { month: "short", day: "numeric" })}</p>
        </section>
      )}
    </div>
  );
}
