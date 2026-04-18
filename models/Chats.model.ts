import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  chatId: {
    type: String,
    required: true,
    unique: true,
  },

  title: {
    type: String,
    default: "New Chat",
  },

  messages: [
    {
      message: {
        type: String,
        required: true
      },

      sender: {
        type: String,
        enum: ["user", "bot"],
        required: true
      },

      emotion: String,

      isFlagged: {
        type: Boolean,
        default: false
      },

      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]

}, {
  timestamps: true
});

// Compound index for fast lookups: all chats for a user, sorted by latest
chatSchema.index({ userId: 1, updatedAt: -1 });

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;