import Link from "next/link";
import { connection } from "next/server";
import { addDays, isoDate, parseDate } from "@/lib/dates";
import { eventDots } from "@/modules/heading/queries";
import { categoryOf } from "@/modules/heading/categories";
import { ChevronIcon } from "@/components/icons";

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  await connection();
  const { m } = await searchParams;
  const today = isoDate();
  const month = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  const first = `${month}-01`;
  const firstDate = parseDate(first);
  const gridStart = addDays(first, -((firstDate.getDay() + 6) % 7)); // Monday-first
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const dots = eventDots(cells);
  const prev = isoDate(new Date(firstDate.getFullYear(), firstDate.getMonth() - 1, 1)).slice(0, 7);
  const next = isoDate(new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 1)).slice(0, 7);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Link href={`/calendar?m=${prev}`} className="btn-ghost px-2" aria-label="Previous month">
          <ChevronIcon dir="left" className="h-5 w-5" />
        </Link>
        <h1 className="h1">{firstDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h1>
        <Link href={`/calendar?m=${next}`} className="btn-ghost px-2" aria-label="Next month">
          <ChevronIcon className="h-5 w-5" />
        </Link>
      </header>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <p key={i} className="eyebrow py-1">
            {d}
          </p>
        ))}
        {cells.map((d) => {
          const inMonth = d.startsWith(month);
          const cats = dots.get(d) ?? [];
          return (
            <Link
              key={d}
              href={`/day/${d}`}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm ${
                d === today ? "bg-gold/15 font-semibold text-accent ring-1 ring-gold/60" : inMonth ? "bg-night-850/70" : "text-ink-faint/50"
              }`}
            >
              {Number(d.slice(8))}
              <span className="flex h-1.5 gap-0.5">
                {[...new Set(cats)].slice(0, 4).map((c) => (
                  <span key={c} className={`h-1.5 w-1.5 rounded-full ${categoryOf(c).dot}`} />
                ))}
              </span>
            </Link>
          );
        })}
      </div>

      <Link href={`/day/${today}`} className="btn w-full">
        Go to today
      </Link>
    </div>
  );
}
