// lib/schedulableTask.ts
import { ITask } from "@/models/Task";

export interface SchedulableTask {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress";
  priority: "low" | "medium" | "high";
  deadline?: string; // YYYY-MM-DD format
  estimatedMinutes: number;
}

export function toSchedulableTask(task: ITask, date?: string): SchedulableTask {
  // Format deadline to YYYY-MM-DD if exists
  let formattedDeadline: string | undefined;
  if (task.deadline) {
    formattedDeadline = task.deadline.toISOString().split('T')[0];
  }

  // Ensure status is valid for scheduling (completed tasks should be filtered out)
  const schedulableStatus = task.status === "completed" ? "in_progress" : task.status;
  
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description || undefined,
    status: schedulableStatus as "todo" | "in_progress",
    priority: task.priority,
    deadline: formattedDeadline,
    estimatedMinutes: task.estimatedMinutes,
  };
}

// Get schedulable tasks for a user
export async function getSchedulableTasks(userId: string, date?: string): Promise<SchedulableTask[]> {
  const tasks = await Task.find({
    userId: userId,
    status: { $ne: "completed" } // Only todo and in_progress
  }).lean();
  
  return tasks.map(task => toSchedulableTask(task, date));
}