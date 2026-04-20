export async function register() {
  // Only run on the server side (Node.js runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCronJobs } = await import("./lib/init-cron");
    startCronJobs();
  }
}
