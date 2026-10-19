import Link from "next/link";
import { connection } from "next/server";
import { trueNorth, trueNorthSections, type TrueNorthSection } from "@/modules/vera/queries";
import { saveTrueNorth } from "@/modules/vera/actions";
import { ChevronIcon } from "@/components/icons";

export default async function TrueNorthPage() {
  await connection();
  const tn = trueNorth();
  const keys = Object.keys(trueNorthSections) as TrueNorthSection[];

  return (
    <div className="space-y-5">
      <Link href="/vera" className="btn-ghost -ml-3">
        <ChevronIcon dir="left" className="h-4 w-4" /> Vera
      </Link>
      <header>
        <p className="eyebrow">Your living profile</p>
        <h1 className="h1">True North</h1>
        <p className="muted mt-1">
          Vera reads this before every plan and review, and adds what she learns from your weeks. Edit anything. It&apos;s yours.
        </p>
      </header>
      <form action={saveTrueNorth} className="space-y-4">
        {keys.map((k) => (
          <label key={k} className="card block">
            <span className="h2 block">{trueNorthSections[k].label}</span>
            <span className="mb-2 block text-xs text-ink-faint">{trueNorthSections[k].hint}</span>
            <textarea name={k} defaultValue={tn[k]} rows={k === "values" ? 5 : 4} className="input min-h-24 py-2 text-sm leading-relaxed" />
          </label>
        ))}
        <button className="btn-gold w-full">Save</button>
      </form>
    </div>
  );
}
