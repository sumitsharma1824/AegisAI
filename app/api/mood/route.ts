import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import MoodIndicator from "@/models/MoodIndicator.model";

const VALID_EMOJIS = ["😄", "🙂", "😐", "😕", "😢", "😭"];

/**
 * GET /api/mood?uid=<firebase_uid>
 * Returns the mood indicator counts + recent history for a user.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mood = await MoodIndicator.findOne({ userId: user._id });

    return NextResponse.json({
      counts: mood?.counts || { "😄": 0, "🙂": 0, "😐": 0, "😕": 0, "😢": 0, "😭": 0 },
      history: mood?.history?.slice(-50) || [], // Return last 50 entries
    });

  } catch (error: any) {
    console.error("GET /api/mood error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/mood
 * Body: { uid, emoji, source: "manual" | "ai" }
 * Increments an emoji counter and logs the event.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, emoji, source } = body;

    if (!uid || !emoji || !source) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedMood = await MoodIndicator.findOneAndUpdate(
      { userId: user._id },
      {
        $inc: { [`counts.${emoji}`]: 1 },
        $push: {
          history: {
            emoji,
            source,
            timestamp: new Date(),
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, counts: updatedMood.counts });

  } catch (error: any) {
    console.error("POST /api/mood error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
