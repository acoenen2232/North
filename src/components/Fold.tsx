"use client";

import { useRef, type ReactNode } from "react";

/** A <details> disclosure that folds itself closed after the form inside is submitted. */
export function Fold({
  summary,
  summaryClassName,
  className,
  defaultOpen,
  children,
}: {
  summary: ReactNode;
  summaryClassName?: string;
  className?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details
      ref={ref}
      className={className}
      open={defaultOpen}
      onSubmit={() => setTimeout(() => ref.current && (ref.current.open = false), 0)}
    >
      <summary className={`cursor-pointer list-none ${summaryClassName ?? ""}`}>{summary}</summary>
      {children}
    </details>
  );
}
