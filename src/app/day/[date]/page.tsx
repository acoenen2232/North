import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { addDays, formatDay, isoDate } from "@/lib/dates";
import { eventsOn } from "@/modules/heading/queries";
import { Timeline } from "@/components/Timeline";
import { AddEventForm } from "@/components/AddEventForm";
import { CalendarIcon, ChevronIcon } from "@/components/icons";

export default async function DayPage({ params }: PageProps<"/day/[date]">) {
  await connection();
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const today = isoDate();

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Link href={`/day/${addDays(date, -1)}`} className="btn-ghost px-2" aria-label="Previous day">
          <ChevronIcon dir="left" className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <p className="eyebrow">{date === today ? "Today" : formatDay(date, { weekday: "long" })}</p>
          <h1 className="h1">{formatDay(date, { month: "long", day: "numeric" })}</h1>
        </div>
        <Link href={`/day/${addDays(date, 1)}`} className="btn-ghost px-2" aria-label="Next day">
          <ChevronIcon className="h-5 w-5" />
        </Link>
      </header>
      <Timeline events={eventsOn(date)} date={date} isToday={date === today} />
      <AddEventForm date={date} />
      <Link href={`/calendar?m=${date.slice(0, 7)}`} className="btn w-full">
        <CalendarIcon className="h-4 w-4" /> Month view
      </Link>
    </div>
  );
}
