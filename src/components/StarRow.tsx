import Link from "next/link";
import type { Star } from "@/modules/stars/queries";
import { completeStar } from "@/modules/stars/actions";
import { formatDay } from "@/lib/dates";
import { CheckIcon, ChevronIcon } from "./icons";

export function StarRow({ star, today }: { star: Star; today: string }) {
  const done = star.status === "done";
  const overdue = !done && star.due_date !== null && star.due_date < today;
  return (
    <li className="flex items-center gap-3 rounded-xl bg-night-850/70 py-2 pl-2 pr-1">
      <form action={completeStar.bind(null, star.id)}>
        <button
          aria-label={done ? "Mark not done" : "Mark done"}
          className={`flex h-8 w-8 items-center justify-center rounded-full border ${
            done ? "border-gold bg-gold text-night-950" : "border-night-600 text-transparent"
          }`}
        >
          <CheckIcon className="h-4 w-4" />
        </button>
      </form>
      <Link href={`/stars/${star.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-2 py-1">
        <span className="min-w-0">
          <span className={`block truncate text-sm ${done ? "text-ink-faint line-through" : ""}`}>{star.title}</span>
          {star.due_date && !done && (
            <span className={`text-xs ${overdue ? "text-bad" : "text-ink-faint"}`}>
              Due {formatDay(star.due_date, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          )}
        </span>
        <ChevronIcon className="h-4 w-4 shrink-0 text-ink-faint" />
      </Link>
    </li>
  );
}
