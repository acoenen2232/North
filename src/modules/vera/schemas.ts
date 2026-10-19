import { z } from "zod";
import { categoryKeys } from "@/modules/heading/categories";

const hhmm = z.string().describe("24-hour time, HH:MM");

export const DailyPlanSchema = z.object({
  note: z
    .string()
    .describe("Vera's one or two sentences for today. Direct, grounded in the data, not cruel."),
  blocks: z
    .array(
      z.object({
        title: z.string(),
        start: hhmm,
        end: hhmm,
        category: z.enum(categoryKeys as [string, ...string[]]),
        star_id: z.number().int().nullable().describe("Id of the Star this block works on, if any"),
        why: z.string().describe("Short reason for this block"),
      }),
    )
    .describe("New time blocks for the free time today. Never overlap existing timed events or work hours."),
  focus_star_ids: z.array(z.number().int()).describe("Up to three Star ids that matter most today"),
  watch_out: z.string().describe("One specific risk for today and what to do about it"),
});

export type DailyPlanContent = z.infer<typeof DailyPlanSchema>;

export const BearingsSchema = z.object({
  headline: z.string().describe("One-line verdict on the week"),
  wins: z.array(z.string()).describe("Specific wins, with numbers where possible"),
  patterns: z.array(z.string()).describe("Patterns in the data, including cross-area ones (sleep vs. lateness, etc.)"),
  drift: z.array(z.string()).describe("Where the week drifted from what was intended"),
  one_change: z.object({
    what: z.string().describe("The single change for next week"),
    why: z.string().describe("The data behind it"),
    how: z.string().describe("Concrete first step"),
  }),
  true_north_updates: z
    .array(
      z.object({
        section: z.enum(["patterns", "works", "doesnt_work"]),
        add: z.string().describe("One short line to add to the profile"),
      }),
    )
    .describe("Durable learnings about this person. Only add what the data supports. Empty if nothing new."),
});

export type BearingsContent = z.infer<typeof BearingsSchema>;
