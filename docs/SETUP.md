# Setting up North at home (Phase 0)

North runs on your personal Windows laptop and you use it from your iPhone. Claude Code can do most of these steps with you; this is the checklist.

## 1. Get the code and run it once

1. Install **Node.js 24 or newer** (nodejs.org, "LTS") and **Git** (git-scm.com).
2. Clone: `git clone https://github.com/acoenen2232/North.git` and open the folder.
3. `npm install`, then `npm run build`, then `npm start`.
4. Open http://127.0.0.1:3000 on the laptop. You'll see "Let's set your bearings". Fill it in.

## 2. Settings file

Copy `.env.example` to `.env.local` and fill in:

- `ANTHROPIC_API_KEY`: from https://console.anthropic.com (API keys). Use a **personal** account. Set a monthly spend limit there; North shows its own spend estimate on the Vera page.
- `NORTH_BACKUP_DIR`: a folder on the USB drive, e.g. `E:\NorthBackups`.

Restart North after changing `.env.local`.

## 3. Phone access with Tailscale

North only listens on the laptop itself (127.0.0.1), so nothing on your Wi-Fi can reach it. Tailscale gives your phone a private, encrypted path to it from anywhere.

1. Install Tailscale on the laptop and the iPhone; sign in to the same account on both.
2. On the laptop, run `tailscale serve --bg 3000`. This gives North an HTTPS address like `https://your-laptop.tailnet-name.ts.net`. HTTPS is required for the home-screen app and notifications.
3. On the iPhone, open that address in **Safari**, tap Share, then **Add to Home Screen**.
4. Open North from the home screen, go to Settings (gear icon on Today), and tap **Turn on reminders on this device**. Then **Send a test**.

## 4. Keep it running

- **Start on boot:** create a Windows Task Scheduler task that runs `npm start` in the North folder at startup (Claude Code can set this up). Check that it survives a restart.
- **Never sleep when plugged in:** Settings, then System, then Power, then set "When plugged in, put my device to sleep after" to **Never**. Closing the lid should "Do nothing" when plugged in (Control Panel, then Power Options, then "Choose what closing the lid does").
- **Backups:** with `NORTH_BACKUP_DIR` set, North copies the database every night at 2 AM and keeps the last 30. `npm run backup` makes one on demand. To restore, stop North and copy a backup over `data/north.db`.

## 5. Updating North

```
git pull
npm install
npm run build
```

Then restart the task. Database changes apply automatically on start.
