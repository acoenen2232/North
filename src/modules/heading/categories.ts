// Event categories. Hobby/together/date feed Spark's free-time balance view later.
export const categories = {
  block: { label: "Focus", dot: "bg-gold", bar: "border-l-gold" },
  routine: { label: "Routine", dot: "bg-ink-muted", bar: "border-l-ink-muted" },
  work: { label: "Work", dot: "bg-night-600", bar: "border-l-night-600" },
  habit: { label: "Habit", dot: "bg-good", bar: "border-l-good" },
  hobby: { label: "Hobby", dot: "bg-[#c7a6ff]", bar: "border-l-[#c7a6ff]" },
  together: { label: "Together", dot: "bg-[#ff9fb8]", bar: "border-l-[#ff9fb8]" },
  rest: { label: "Rest", dot: "bg-[#8fb8ff]", bar: "border-l-[#8fb8ff]" },
  errand: { label: "Errand", dot: "bg-warn", bar: "border-l-warn" },
} as const;

export type Category = keyof typeof categories;

export const categoryKeys = Object.keys(categories) as Category[];

export function categoryOf(key: string) {
  return categories[key as Category] ?? categories.block;
}
