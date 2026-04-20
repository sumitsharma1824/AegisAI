import cron from "node-cron";
import { generateAllUserSummaries } from "./cron-handler";

let isStarted = false;

export function startCronJobs() {
  if (isStarted) {
    console.log("🕒 [Cron] Jobs already started. Skipping initialization.");
    return;
  }

  console.log("🕒 [Cron] Initializing Midnight Background Jobs...");

  // Schedule for 12:00 AM every day
  // Format: second (optional), minute, hour, day of month, month, day of week
  // Next-cron uses 5 or 6 fields. Standard node-cron is 5 fields: min hr day mon dow
  
  cron.schedule("0 0 * * *", () => {
    generateAllUserSummaries();
  }, {
    timezone: "UTC" // or your specific timezone if known, e.g., "Asia/Kolkata"
  });

  console.log("✅ [Cron] Scheduled: 00:00 AM Daily Summary Task.");
  isStarted = true;
}
