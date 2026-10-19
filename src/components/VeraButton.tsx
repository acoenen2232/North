"use client";

import { useActionState } from "react";
import type { VeraState } from "@/modules/vera/actions";

/** A button that runs a Vera action and shows her thinking / any error. */
export function VeraButton({
  action,
  label,
  pendingLabel,
  variant = "gold",
}: {
  action: () => Promise<VeraState>;
  label: string;
  pendingLabel: string;
  variant?: "gold" | "plain";
}) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="space-y-2">
      <button className={`${variant === "gold" ? "btn-gold" : "btn"} w-full`} disabled={pending}>
        {pending ? (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> {pendingLabel}
          </>
        ) : (
          label
        )}
      </button>
      {state.error && <p className="text-center text-sm text-bad">{state.error}</p>}
    </form>
  );
}
