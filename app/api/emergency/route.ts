// import { NextResponse } from "next/server";
// import mongoose from "mongoose";
// import twilio from "twilio";
// import User from "@/models/User";

// const client = twilio(
//   process.env.TWILIO_SID!,
//   process.env.TWILIO_AUTH_TOKEN!
// );

// export async function POST(req: Request) {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI!);

//     const { action, location, uid } = await req.json();
//     console.log("EMERGENCY REQUEST:", { action, location, uid });

//     const user = await User.findOne({ uid }).lean();

//     if (!user) {
//       return NextResponse.json(
//         { error: "User not found" },
//         { status: 404 }
//       );
//     }

//     if (action === "call") {
//       return NextResponse.json({
//         type: "call",
//         number: "112"
//       });
//     }

//     if (action === "sms") {
//       const contacts = user.trustedContacts || [];
//       console.log("USER CONTACTS:", contacts);
//       const message =
//         user.emergencyMessage ||
//         "I may need help. Please check on me.";

//       if (contacts.length === 0) {
//         return NextResponse.json(
//           { error: "No contacts saved" },
//           { status: 400 }
//         );
//       }

//       const finalMessage = `
// ${message}

// 📍 Location:
// ${location}
//       `;

//       for (const number of contacts) {
//         await client.messages.create({
//           body: finalMessage,
//           from: process.env.TWILIO_PHONE_NUMBER!,
//           to: number
//         });
//       }

//       return NextResponse.json({ success: true });
//     }

//     return NextResponse.json({ error: "Invalid action" }, { status: 400 });

//   } catch (err: any) {
//     console.error(err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }


import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    const { action, location, uid, useAI } = await req.json();

    const user = await User.findOne({ uid });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 📞 CALL
    if (action === "call") {
      return NextResponse.json({
        type: "call",
        number: "112"
      });
    }

    // 📩 SMS
    if (action === "sms") {
      const contacts = user.trustedContacts || [];

      if (contacts.length === 0) {
        return NextResponse.json(
          { error: "No contacts saved" },
          { status: 400 }
        );
      }

      let finalMessage = "";

      // 🔴 DEFAULT MESSAGE
      if (!useAI) {
        const message =
          user.emergencyMessage ||
          "I may need help. Please check on me.";

        finalMessage = `
${message}

📍 Location:
${location}
        `.trim();
      }

      // 🤖 AI MESSAGE

else {
  let latestSummary: string = "No recent activity";

  if (user.summaryMap && user.summaryMap.size > 0) {
    const entries = Array.from(user.summaryMap.entries());
    entries.sort((a, b) => b[0].localeCompare(a[0]));
    latestSummary = entries[0][1];
  }

  if (typeof latestSummary !== "string") {
    latestSummary = String(latestSummary);
  }

  finalMessage = `
🚨 AEGIS ALERT

${user.name} may need attention.

🧠 Mood: ${user.dominantEmotion || "Unknown"}
⚠️ Stress: ${Math.round(user.avgStress || 0)}%

📝 ${latestSummary}

📍 Location:
${location}
  `.trim();
}

      return NextResponse.json({
        success: true,
        contacts,
        message: finalMessage
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (err: any) {
    console.error("EMERGENCY ERROR:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
} 