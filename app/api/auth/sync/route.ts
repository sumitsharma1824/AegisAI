import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { uid, email } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Find the user by UID, or create a new one using upsert
    const user = await User.findOneAndUpdate(
      { uid },
      { 
        $setOnInsert: { email, uid, isProfileComplete: false } 
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
