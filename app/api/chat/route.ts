import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Chat from "@/models/Chats.model";

/**
 * GET /api/chat?uid=<firebase_uid>
 * Returns ALL chat sessions for a user (id, title, message count, last updated).
 * 
 * GET /api/chat?uid=<firebase_uid>&chatId=<chat_session_id>
 * Returns the full messages for a specific chat session.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const chatId = searchParams.get("chatId");

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If chatId is provided, return messages for that specific session
    if (chatId) {
      const chat = await Chat.findOne({ userId: user._id, chatId });
      return NextResponse.json({
        chatId: chat?.chatId || chatId,
        title: chat?.title || "New Chat",
        messages: chat?.messages || [],
      });
    }

    // Otherwise, return a list of all chat sessions (without full messages for perf)
    const chats = await Chat.find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .select("chatId title updatedAt")
      .lean();

    return NextResponse.json({ sessions: chats });

  } catch (error: any) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/chat
 * Body: { uid, chatId, message, sender, timestamp?, title? }
 * Appends a message to a specific chat session (creates session if it doesn't exist).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, chatId, message, sender, timestamp, title } = body;

    if (!uid || !chatId || !message || !sender) {
      return NextResponse.json({ error: "Missing required fields (uid, chatId, message, sender)" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build the update object
    const updateObj: any = {
      $push: {
        messages: {
          message,
          sender,
          timestamp: timestamp ? new Date(timestamp) : new Date()
        }
      }
    };

    // Update the title if provided (e.g., from the first user message)
    if (title) {
      updateObj.$set = { title };
    }

    const updatedChat = await Chat.findOneAndUpdate(
      { userId: user._id, chatId },
      updateObj,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, chatId: updatedChat.chatId });

  } catch (error: any) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
