import mongoose from "mongoose";

/**
 * MoodIndicator Model
 * 
 * Tracks mood distribution for each user across sessions.
 * Each emoji maps to a numeric "stress weight" for graph computation.
 * 
 * Weights (lower = happier, higher = more stressed):
 *   😄 = 0, 🙂 = 1, 😐 = 2, 😕 = 3, 😢 = 4, 😭 = 5
 */
const moodEntrySchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  source: { type: String, enum: ["manual", "ai"], required: true },
  timestamp: { type: Date, default: Date.now },
});

const moodIndicatorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  // Aggregate counters for quick reads
  counts: {
    "😄": { type: Number, default: 0 },
    "🙂": { type: Number, default: 0 },
    "😐": { type: Number, default: 0 },
    "😕": { type: Number, default: 0 },
    "😢": { type: Number, default: 0 },
    "😭": { type: Number, default: 0 },
  },

  // Granular log of every mood event (for time-series analysis)
  history: [moodEntrySchema],

}, { timestamps: true });

const MoodIndicator = mongoose.models.MoodIndicator || mongoose.model("MoodIndicator", moodIndicatorSchema);
export default MoodIndicator;
