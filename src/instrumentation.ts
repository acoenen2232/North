export async function register() {
  // Reminders and backups run in the Node.js server process only.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
