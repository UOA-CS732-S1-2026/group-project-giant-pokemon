// types/task.ts

export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

// 前端使用的 Task 类型
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedMinutes: number;
  deadline?: string; // YYYY-MM-DD format
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// API 返回的 Task 类型（MongoDB 文档格式）
export interface TaskAPI {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedMinutes: number;
  deadline?: string; // YYYY-MM-DD format
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// 日程安排引擎需要的 Schedulable Task 类型
export interface SchedulableTask {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress"; // completed 的任务不会被调度
  priority: TaskPriority;
  deadline?: string; // YYYY-MM-DD format
  estimatedMinutes: number;
}

// 创建任务时的输入类型
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  deadline?: string; // YYYY-MM-DD format
  status?: TaskStatus;
}

// 更新任务时的输入类型
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimatedMinutes?: number;
  deadline?: string | null;
}

// API 响应类型
export interface TaskResponse {
  success: boolean;
  data?: Task | Task[];
  error?: string;
}

// 辅助函数：将 Task 转换为 SchedulableTask
export function toSchedulableTask(task: Task): SchedulableTask {
  const schedulableStatus = task.status === "completed" ? "in_progress" : task.status;
  
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: schedulableStatus as "todo" | "in_progress",
    priority: task.priority,
    deadline: task.deadline,
    estimatedMinutes: task.estimatedMinutes,
  };
}

// 辅助函数：验证 deadline 格式
export function isValidDeadline(dateString: string): boolean {
  if (!dateString) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// 辅助函数：获取任务状态的中文显示
export function getStatusText(status: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    "todo": "待办",
    "in_progress": "进行中",
    "completed": "已完成"
  };
  return statusMap[status];
}

// 辅助函数：获取优先级的样式类名
export function getPriorityColor(priority: TaskPriority): string {
  const colorMap: Record<TaskPriority, string> = {
    "high": "text-red-600 bg-red-50",
    "medium": "text-yellow-600 bg-yellow-50",
    "low": "text-green-600 bg-green-50"
  };
  return colorMap[priority];
}

// 辅助函数：获取状态的颜色样式
export function getStatusColor(status: TaskStatus): string {
  const colorMap: Record<TaskStatus, string> = {
    "todo": "text-blue-600 bg-blue-50",
    "in_progress": "text-purple-600 bg-purple-50",
    "completed": "text-gray-600 bg-gray-50"
  };
  return colorMap[status];
}

// 任务过滤选项
export interface TaskFilters {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  search?: string;
}

// 过滤任务函数
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter(task => {
    if (filters.status && filters.status !== "all" && task.status !== filters.status) {
      return false;
    }
    
    if (filters.priority && filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }
    
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      return task.title.toLowerCase().includes(searchTerm) ||
             (task.description && task.description.toLowerCase().includes(searchTerm));
    }
    
    return true;
  });
}