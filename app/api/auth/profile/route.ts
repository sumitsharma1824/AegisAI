import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { uid, name, age, gender, maritalStatus, profilePicUrl, secretKey } = data;

    if (!uid) {
      return NextResponse.json({ error: "Missing required UID" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOneAndUpdate(
      { uid },
      { 
        $set: {
          name,
          age,
          gender,
          maritalStatus,
          profilePicUrl,
          secretKey,
          isProfileComplete: true
        }
      },
      { new: true }
    );

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    console.error("Profile Setup Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
