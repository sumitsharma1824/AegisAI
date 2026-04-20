## How Summaries are Calculated
The summary system follows a **Cumulative Delegation** model:

1.  **Context Collection**: Every time a user sends a message, our backend fetches the existing `summaryMap` (previous days' summaries) and the latest chat exchange.
2.  **External AI Processing**: This data is sent to the specialized `/daily-summary` endpoint. The AI uses the `old_summary` context to understand the user's history and creates an updated, semantically linked summary for the current day.
3.  **Timestamping**: New additions within the backend are prefixed with the local HH:mm timestamp before inclusion in the cumulative map.
4.  **Mathematical Aggregation**: `avgStress` is calculated as a **running average** across all recorded analysis events, ensuring that the final score reflects the user's total wellbeing trajectory rather than just a single moment.

## Database Storage (User Model)
We store the following enriched metrics in the `User` document:

-   `summaryMap` (Map): Key-Value pairs of `{ "YYYY-MM-DD": "Summary text..." }`. This builds up indefinitely.
-   `dominantEmotion` (String): The primary emotion detected across recent interactions (e.g., "Anxious", "Neutral").
-   `avgStress` (Number): A 0-100 float representing the average stress risk detected life-to-date.
-   `riskTrend` (String): The direction of the user's mental health risk (e.g., "Increasing", "Decreasing").
-   `totalAnalysisCount` (Number): Used for calculating the weighted average stress score.

## How to Fetch the Data

### 1. From the Backend (Node.js/Next.js)
If you are working in an API route, fetch the user by their UID:

```javascript
import User from "@/models/User";

const user = await User.findOne({ uid: "user_uid_here" });
const summaryMap = user.summaryMap; // This is a Map
const latestDate = Object.keys(Object.fromEntries(summaryMap)).sort().reverse()[0];
const latestSummary = summaryMap.get(latestDate);
```

## Background Summary Generation (12:00 AM)
We use a native **TypeScript Background Worker** to ensure summaries are ready every morning:

- **Technology**: Built using `node-cron` and integrated via Next.js `instrumentation.ts`.
- **Logic**: At 12:00 AM UTC daily, the server automatically iterates through all users who had chat activity the previous day.
- **Goal**: It calls the `/daily-summary` AI service to generate a final, semantic "Daily Wrap-up" for that day and saves it to the database.
- **Reliability**: This ensures that even if a user closes their browser mid-conversation, the record in `summaryMap` is completed by midnight for the emergency system to use.

### Manual Trigger (Optional)
If you need to force a summary update for a user without waiting for midnight, the frontend still triggers an incremental update to `/api/chat/analysis` after every single message.

## Formatting for SMS
When sending an emergency SMS, you can format the data like this:

```javascript
const message = `
🚨 AEGIS AI EMERGENCY ALERT
User: ${user.name}
Latest Summary (${latestDate}): ${latestSummary}
Overall Mood: ${user.dominantEmotion}
Stress Level: ${user.avgStress.toFixed(0)}%
Trend: ${user.riskTrend}
`.trim();
```

## AI Service Synchronization
The summary is automatically synchronized with the AI service at:
`POST https://stress-ai-service-n783.onrender.com/daily-summary`

Your teammate (the one handling this part) has ensured that this endpoint returns the updated `summary` map, which our backend then persists.

---
**Note**: If you need to trigger a manual summary refresh, you can call the `/api/chat/analysis` endpoint with the latest message logs.
