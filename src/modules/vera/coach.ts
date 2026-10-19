import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { run } from "@/lib/db";
import { nowStamp } from "@/lib/dates";

// A cheaper, faster model for the daily plan; the most capable model for the weekly review.
// Override in .env.local with VERA_DAILY_MODEL / VERA_WEEKLY_MODEL.
export const veraModels = {
  daily: process.env.VERA_DAILY_MODEL || "claude-sonnet-5-5",
  weekly: process.env.VERA_WEEKLY_MODEL || "claude-fable-5-1",
};

// Models that accept server-side fallback on a safety decline (re-run on another model in the same call).
const FALLBACK_MODELS = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

export function veraConnected(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const VERA_SYSTEM = `You are Vera, the coach inside North, a personal planning app used by one person.

Voice: direct, tough love, never cruel. Tell the truth with data and cite the numbers ("You planned 6am four times, hit it once. We're moving it."). Short sentences. No cheerleading, no exclamation points, no guilt trips, no therapy-speak. Praise only what the data supports. When something isn't working, change the plan, not her character.

How you coach:
- One change at a time. Small and specific beats ambitious.
- Fit the plan to the person who actually shows up, not the ideal version. Use the real averages, not the targets.
- Start from what has already worked for her (True North "Works for me", fixes that helped, "what went right" notes) before generic advice.
- Look across areas: sleep and energy vs. lateness, prep the night before vs. arrival time, habits vs. mood.
- Protect sleep. Rest and hobbies are not rewards to be earned; never apply streak pressure to hobbies.
- If morning mode is MEASURING, don't change the morning yet. Observe and say what the data is starting to show.
- Never invent data. If there isn't enough yet, say so plainly and keep it short.`;

export class VeraError extends Error {}

type Kind = "daily_plan" | "bearings";

export async function askVera<S extends z.ZodType>(
  kind: Kind,
  schema: S,
  prompt: string,
): Promise<{ output: z.infer<S>; model: string }> {
  if (!veraConnected()) throw new VeraError("Vera isn't connected yet. Add your Claude API key to .env.local.");

  const model = kind === "bearings" ? veraModels.weekly : veraModels.daily;
  const client = new Anthropic();
  const fallback = FALLBACK_MODELS.has(model);

  let res;
  try {
    res = await client.beta.messages.parse({
      model,
      max_tokens: 16000,
      ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      output_config: {
        effort: kind === "bearings" ? "high" : "medium",
        format: betaZodOutputFormat(schema),
      },
      system: VERA_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new VeraError("The Claude API key isn't working. Check .env.local.");
    if (err instanceof Anthropic.PermissionDeniedError) throw new VeraError("This API key can't use that model. Check your Claude account.");
    if (err instanceof Anthropic.RateLimitError) throw new VeraError("Vera's being rate limited. Try again in a minute.");
    if (err instanceof Anthropic.APIConnectionError) throw new VeraError("Can't reach Claude. Is the laptop online?");
    if (err instanceof Anthropic.APIError) throw new VeraError(`Claude returned an error (${err.status}). Try again.`);
    throw err;
  }

  run(
    "INSERT INTO vera_calls (kind, model, input_tokens, output_tokens, cache_read_tokens, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    kind,
    res.model,
    res.usage.input_tokens,
    res.usage.output_tokens,
    res.usage.cache_read_input_tokens ?? 0,
    nowStamp(),
  );

  if (res.stop_reason === "refusal") throw new VeraError("Vera couldn't answer that one. Try again.");
  if (res.stop_reason === "max_tokens" || !res.parsed_output) throw new VeraError("Vera's answer got cut off. Try again.");
  return { output: res.parsed_output as z.infer<S>, model: res.model };
}
