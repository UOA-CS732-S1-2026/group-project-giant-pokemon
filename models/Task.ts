import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  estimatedMinutes: number;
  deadline?: Date;
  scheduledDate?: string;
  scheduledStartTime?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    estimatedMinutes: {
      type: Number,
      default: 60,
      min: 1,
      max: 480,
    },
    deadline: { type: Date },
    scheduledDate: { type: String },
    scheduledStartTime: { type: String },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const TaskModel = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
export default TaskModel;