import { addEvent } from "@/modules/heading/actions";
import { categories, categoryKeys } from "@/modules/heading/categories";
import { PlusIcon } from "./icons";
import { Fold } from "./Fold";

export function AddEventForm({ date }: { date: string }) {
  return (
    <Fold
      className="card"
      summaryClassName="flex items-center gap-2 text-sm text-gold"
      summary={
        <>
          <PlusIcon className="h-4 w-4" /> Add a block
        </>
      }
    >
      <form action={addEvent} className="mt-3 space-y-3">
        <input type="hidden" name="date" value={date} />
        <input name="title" required placeholder="What?" className="input" />
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="label">Start</span>
            <input type="time" name="start" className="input" />
          </label>
          <label>
            <span className="label">End</span>
            <input type="time" name="end" className="input" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="label">Kind</span>
            <select name="category" className="input" defaultValue="block">
              {categoryKeys.map((k) => (
                <option key={k} value={k}>
                  {categories[k].label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Repeat</span>
            <select name="repeat" className="input" defaultValue="none">
              <option value="none">Just this day</option>
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
        </div>
        <input name="notes" placeholder="Note (optional)" className="input" />
        <button className="btn-gold w-full">Add to the day</button>
      </form>
    </Fold>
  );
}
