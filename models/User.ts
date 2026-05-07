import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    // Profile
    role: { type: String, default: "Student" },
    mainGoal: { type: String, default: "" },

    // Planning Preferences
    startTime: { type: String, default: "09:00 AM" },
    endTime: { type: String, default: "05:00 PM" },
    workload: { type: String, default: "Balanced" },
    focusStyle: { type: String, default: "Deep Work" },
    breakPref: { type: String, default: "15 minutes" },

    // Personalisation
    motivation: { type: String, default: "Encouraging" },
    priority: { type: String, default: "Balanced" },
    scheduleStyle: { type: String, default: "Flexible blocks" },

    // XP + Streak
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);