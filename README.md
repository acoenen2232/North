# North

A personal planner and life coach that runs on your own laptop and lives on your phone's home screen.

- **Today's Heading**: your day as time blocks, with a built-in calendar.
- **Morning mode**: tap start/stop on each part of your morning, see where the time goes, then (step two) an evening prep checklist and a live "leave by" countdown.
- **Stars**: goals and to-dos. When you're stuck, "Why am I putting this off?" suggests a fix and learns which fixes work for you.
- **Constellations**: habits. For the ones you're building, log what went right. For the ones you're breaking, log what triggered them.
- **Check-in**: mood, energy and sleep in under a minute.
- **Vera**: your coach. She plans your day and runs **Bearings**, a weekly review, using your real data. She keeps **True North**, a living profile of what works for you.
- **Reminders** on your phone.

Your data stays in one file on the laptop (`data/north.db`). The only thing that leaves is what Vera needs for each request to Claude.

## Running it

```
npm install
npm run build
npm start          # http://127.0.0.1:3000
```

For development: `npm run dev`. Before committing: `npm run check`.

Settings live in `.env.local` (copy `.env.example`). Setting up the laptop as an always-on home server with phone access via Tailscale is covered in [docs/SETUP.md](docs/SETUP.md).

## Roadmap

- **Phase 1 (built):** Today's Heading and calendar, Morning mode, Stars, Constellations, check-in, Vera (daily plan, Bearings, True North), reminders, nightly backups.
- **Phase 2, Spark:** hobby inventory, hobby dates, joy log, "together, separately" nights, a free-time balance view.
- **Phase 3, Money:** budget, spending log, bank CSV import, spending vs. mood.
- **Phase 4, Style:** wardrobe, routines, outfit photos with Vera's feedback.
