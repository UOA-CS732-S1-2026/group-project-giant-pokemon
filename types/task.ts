export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedMinutes: number;
  deadline?: string;
  scheduledDate?: string;      // YYYY-MM-DD
  scheduledStartTime?: string; // HH:MM
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAPI {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedMinutes: number;
  deadline?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulableTask {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress";
  priority: TaskPriority;
  deadline?: string;
  estimatedMinutes: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  deadline?: string;
  status?: TaskStatus;
  scheduledDate?: string;
  scheduledStartTime?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimatedMinutes?: number;
  deadline?: string | null;
  scheduledDate?: string | null;
  scheduledStartTime?: string | null;
}

export interface TaskResponse {
  success: boolean;
  data?: Task | Task[];
  error?: string;
}

export interface TaskFilters {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  search?: string;
}

export function toSchedulableTask(task: Task): SchedulableTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status === "completed" ? "todo" : task.status,
    priority: task.priority,
    deadline: task.deadline,
    estimatedMinutes: task.estimatedMinutes || 60,
  };
}

export function isValidDeadline(dateString: string): boolean {
  if (!dateString) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  return !isNaN(new Date(dateString).getTime());
}

export function getStatusText(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = { 
    todo: "Todo", 
    in_progress: "In Progress", 
    completed: "Completed" 
  };
  return map[status];
}

export function getPriorityColor(priority: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    high: "text-red-600 bg-red-50",
    medium: "text-yellow-600 bg-yellow-50",
    low: "text-green-600 bg-green-50",
  };
  return map[priority];
}

export function getStatusColor(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    todo: "text-blue-600 bg-blue-50",
    in_progress: "text-purple-600 bg-purple-50",
    completed: "text-gray-600 bg-gray-50",
  };
  return map[status];
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter(task => {
    if (filters.status && filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.priority && filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (filters.search && filters.search.trim()) {
      const s = filters.search.toLowerCase();
      return task.title.toLowerCase().includes(s) ||
        (task.description && task.description.toLowerCase().includes(s));
    }
    return true;
  });
}