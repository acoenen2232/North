import { saveCheckin } from "@/modules/checkin/actions";
import { energyLabels, moodLabels, sleepQualityLabels, type Checkin } from "@/modules/checkin/queries";

// Under a minute: four taps and save. Plain radios, no client JS.
export function CheckinCard({ date, checkin }: { date: string; checkin: Checkin | null }) {
  if (checkin) {
    return (
      <details className="card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
          <span className="eyebrow">Checked in</span>
          <span className="text-xs text-ink-muted">
            {[
              checkin.mood && `Mood ${moodLabels[checkin.mood - 1].toLowerCase()}`,
              checkin.energy && `energy ${energyLabels[checkin.energy - 1].toLowerCase()}`,
              checkin.sleep_hours && `${checkin.sleep_hours}h sleep`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </summary>
        <CheckinForm date={date} checkin={checkin} />
      </details>
    );
  }
  return (
    <section className="card">
      <p className="eyebrow">Quick check-in</p>
      <CheckinForm date={date} checkin={null} />
    </section>
  );
}

function CheckinForm({ date, checkin }: { date: string; checkin: Checkin | null }) {
  return (
    <form action={saveCheckin} className="mt-3 space-y-3">
      <input type="hidden" name="date" value={date} />
      <Scale name="mood" label="Mood" labels={moodLabels} value={checkin?.mood} />
      <Scale name="energy" label="Energy" labels={energyLabels} value={checkin?.energy} />
      <Scale
        name="sleep_hours"
        label="Sleep"
        labels={["5", "6", "7", "8", "9+"]}
        values={[5, 6, 7, 8, 9]}
        value={checkin?.sleep_hours ? Math.min(9, Math.max(5, Math.round(checkin.sleep_hours))) : undefined}
        suffix="h"
      />
      <Scale name="sleep_quality" label="Sleep quality" labels={sleepQualityLabels} value={checkin?.sleep_quality} />
      <input name="note" defaultValue={checkin?.note ?? ""} placeholder="Anything worth remembering? (optional)" className="input" />
      <button className="btn-gold w-full">Save</button>
    </form>
  );
}

function Scale({
  name,
  label,
  labels,
  values,
  value,
  suffix = "",
}: {
  name: string;
  label: string;
  labels: string[];
  values?: number[];
  value?: number | null;
  suffix?: string;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {labels.map((l, i) => {
          const v = values ? values[i] : i + 1;
          return (
            <label key={l} className="block">
              <input type="radio" name={name} value={v} defaultChecked={value === v} className="peer sr-only" />
              <span className="flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-night-600 bg-night-800 px-1 text-xs text-ink-muted transition peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-accent-bright">
                {l}
                {suffix && values ? suffix : ""}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
