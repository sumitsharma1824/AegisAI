import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Summary from "@/models/Response.model";

export async function generateAllUserSummaries() {
  console.log("🕒 [Cron] Starting Midnight Summary Generation...");
  
  try {
    await dbConnect();
    
    // 1. Identify "Yesterday"
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD
    
    // 2. Find all users
    const users = await User.find({});
    console.log(`🕒 [Cron] Found ${users.length} users to check.`);

    for (const user of users) {
      // Check if they already have a summary for this date
      if (user.summaryMap && user.summaryMap.has(dateKey)) {
        continue;
      }

      // 3. Check for activity (Summary records) from yesterday
      const startOfDay = new Date(yesterday);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(yesterday);
      endOfDay.setHours(23, 59, 59, 999);

      const yesterdayActivities = await Summary.find({
        userId: user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ createdAt: 1 });

      if (yesterdayActivities.length === 0) {
        // Optional: Add a default "No activity" if you want a entry for every single day
        // For now, only summarize if there was activity as per standard patterns
        continue;
      }

      console.log(`🕒 [Cron] Generating summary for User: ${user.uid} for ${dateKey}`);

      // 4. Prepare data for External AI
      const messages = yesterdayActivities.map(act => ({
        role: "assistant", // Historically, summaries are bot responses
        content: act.aiResponse,
        timestamp: act.createdAt.toISOString()
      }));

      const oldSummaryObj = Object.fromEntries(user.summaryMap || new Map());
      
      const externalApiUrl = "https://stress-ai-service-n783.onrender.com/daily-summary";
      const payload = {
        user_id: user.uid,
        date: dateKey,
        messages: messages,
        old_summary: oldSummaryObj
      };

      try {
        const res = await fetch(externalApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          
          if (data.summary) {
            // Update the map
            Object.entries(data.summary).forEach(([d, t]) => {
              user.summaryMap.set(d, t as string);
            });
            
            user.dominantEmotion = data.dominant_emotion || user.dominantEmotion;
            user.riskTrend = data.risk_trend || user.riskTrend;
            
            // Running average check if needed, but daily summary usually returns its own avg
            if (data.avg_stress !== undefined) {
              const currentAvg = user.avgStress || 0;
              const count = user.totalAnalysisCount || 0;
              user.avgStress = ((currentAvg * count) + data.avg_stress) / (count + 1);
              user.totalAnalysisCount = count + 1;
            }

            await user.save();
            console.log(`✅ [Cron] Summary saved for ${user.uid}`);
          }
        } else {
          console.error(`❌ [Cron] AI API failed for ${user.uid}:`, await res.text());
        }
      } catch (err) {
        console.error(`❌ [Cron] Error calling AI API for ${user.uid}:`, err);
      }
    }

    console.log("🕒 [Cron] Midnight Summary Generation Completed.");
  } catch (error) {
    console.error("❌ [Cron] Fatal error in daily summary job:", error);
  }
}
