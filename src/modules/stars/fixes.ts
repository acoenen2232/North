// "Why am I putting this off?" Each reason has fixes; North tracks which ones actually work for you.

export const reasons = {
  unclear: { label: "Unclear", prompt: "I don't know exactly what to do next." },
  boring: { label: "Boring", prompt: "It's dull and I'd rather do anything else." },
  too_big: { label: "Too big", prompt: "It's a mountain. I don't know where to start." },
  scary: { label: "Scary", prompt: "I'm worried about doing it badly or what happens after." },
  low_energy: { label: "Low energy", prompt: "I'm just too tired for it right now." },
} as const;

export type Reason = keyof typeof reasons;
export const reasonKeys = Object.keys(reasons) as Reason[];

export const fixes: Record<Reason, { key: string; label: string; how: string }[]> = {
  unclear: [
    { key: "next_action", label: "Name the next physical action", how: "Rewrite it as the very first thing your hands do. \"Open the doc\", not \"do taxes\"." },
    { key: "ask_someone", label: "Ask one question", how: "Send one message to whoever knows. Waiting on an answer counts as progress." },
    { key: "define_done", label: "Define done", how: "Write one sentence: \"This is finished when…\"" },
  ],
  boring: [
    { key: "pair_it", label: "Pair it with something good", how: "Music, a podcast, a good drink. Only while doing this." },
    { key: "timer_10", label: "10-minute timer", how: "Do it for 10 minutes. You're allowed to stop when it rings." },
    { key: "reward", label: "Reward after", how: "Pick a small reward now; collect it the moment you finish." },
  ],
  too_big: [
    { key: "split_3", label: "Split into 3 steps", how: "Break it into three smaller to-dos, each under 20 minutes." },
    { key: "smallest_step", label: "Do the 2-minute step", how: "Find the piece that takes 2 minutes. Do only that." },
    { key: "schedule_block", label: "Give it a block", how: "Put a time block on the calendar. Decide when, not whether." },
  ],
  scary: [
    { key: "worst_case", label: "Write the worst case", how: "Worst case, how likely it is, and what you'd do. It usually shrinks." },
    { key: "ugly_draft", label: "Ugly first draft", how: "Make a deliberately bad version. You can fix bad; you can't fix blank." },
    { key: "tell_someone", label: "Tell someone you're doing it", how: "A little accountability takes the edge off." },
  ],
  low_energy: [
    { key: "five_min", label: "The 5-minute version", how: "What's the version you could do half-asleep? Do that." },
    { key: "peak_time", label: "Move it to peak energy", how: "Reschedule it to the time of day you're sharpest." },
    { key: "reset_first", label: "Reset first", how: "Water, snack, 5 minutes outside. Then try again." },
  ],
};

export function fixFor(reason: string, key: string) {
  return fixes[reason as Reason]?.find((f) => f.key === key);
}
