@AGENTS.md

# North

A single-user personal planner + AI coach (Vera). Self-hosted on the owner's Windows laptop, used from an iPhone home-screen PWA over Tailscale. The owner is not technical: explain setup steps in plain language, one at a time.

**Privacy rule:** this repo is public. Never commit personal details (times, routines, names, relationships, health). They belong in the local database via the app's Settings/True North, not in code, seeds, docs or commit messages. `data/`, `backups/` and `.env*` are gitignored.

## Stack

Next.js 16 (App Router, Cache Components on), React 19, TypeScript, Tailwind v4, `node:sqlite` (Node ≥ 24, no native deps), `@anthropic-ai/sdk`, `web-push`, zod.

## Layout

- `src/modules/<module>/`: one folder per life area.
  - `schema.ts`: migrations (`ModuleSchema`), registered in `src/modules/registry.ts`. Never edit a shipped migration; add a new id.
  - `queries.ts`: synchronous reads via `all/get/run/tx` from `src/lib/db.ts`.
  - `actions.ts`: `"use server"` mutations; end with `refresh()` (or `redirect`).
- `src/app/`: routes. Every page that reads the DB starts with `await connection()` (the root layout wraps children in `<Suspense>`), otherwise Next prerenders stale data at build time.
- `src/modules/vera/`: `context.ts` builds plain-text digests across modules (this is where cross-module insights come from), `coach.ts` calls Claude with structured output, `schemas.ts` holds zod schemas.
- `src/lib/scheduler.ts`: started from `src/instrumentation.ts`; fires reminders (web push) and the nightly backup.
- Times: local laptop time. Dates are `YYYY-MM-DD` strings; times of day are minutes since midnight (`src/lib/dates.ts`). Timestamps are ISO strings.

## Adding a module (Spark, Money, Style…)

1. `src/modules/<id>/schema.ts` with migrations, then append to `modules` in `registry.ts`.
2. `queries.ts` + `actions.ts`, then a route in `src/app/<id>/`.
3. Add a digest function to `src/modules/vera/context.ts` and include it in `weekDigest` so Vera sees it.
4. Event categories in `src/modules/heading/categories.ts` already include `hobby` and `together` for Spark's balance view.

## Vera

Voice: direct, tough love, not cruel, always cites data. Daily plan uses `VERA_DAILY_MODEL` (default `claude-sonnet-5-5`); Bearings uses `VERA_WEEKLY_MODEL` (default `claude-fable-5-1`). Spark is gentler: no streak pressure or guilt on hobbies. Morning mode has a "measure" phase (first 2 weeks, observe only) before "improve"; respect it.

## Conventions

- Mobile-first, dark only (navy + gold tokens in `globals.css`). Daily logging must stay under 60 seconds: prefer one-tap buttons and radio chips over text entry.
- Prefer server components + form actions; client components only for live clocks, push setup, and pending states.
- `npm run check` (tsc + eslint) and `npm run build` must pass before committing.
