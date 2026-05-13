import type { Goal } from "@/types/goal";
import type { Task, TaskPriority } from "@/types/task";

export type OceanStatus = "empty" | "polluted" | "recovering" | "healthy" | "thriving";

export type OceanItem = {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline?: string;
  completed: boolean;
  xpValue: number;
  statusLabel: string;
};

export type TaskStats = {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  oceanHealth: number;
};

export type GoalStats = {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  averageProgress: number;
};

export type LevelInfo = {
  currentLevelNumber: number;
  currentLevelName: string;
  currentLevelLabel: string;
  currentLevelStartXP: number;
  nextLevelXP: number | null;
  xpNeededForNextLevel: number;
  levelProgressPercent: number;
  isMaxLevel: boolean;
};

export type Achievement = {
  name: string;
  description: string;
  unlocked: boolean;
  accent: "blue" | "emerald" | "amber" | "rose";
};

const XP_BY_PRIORITY: Record<TaskPriority, number> = {
  low: 10,
  medium: 20,
  high: 30,
};

const LEVELS = [
  { number: 1, name: "Starter", startXP: 0, nextLevelXP: 100 },
  { number: 2, name: "Organizer", startXP: 100, nextLevelXP: 200 },
  { number: 3, name: "Planner", startXP: 200, nextLevelXP: 300 },
  { number: 4, name: "Achiever", startXP: 300, nextLevelXP: 400 },
  { number: 5, name: "Master Scheduler", startXP: 400, nextLevelXP: 500 },
  { number: 6, name: "Ocean Guardian", startXP: 500, nextLevelXP: null },
];

export function normalizeDate(value?: string): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

export function isTaskCompleted(task: Pick<Task, "status">): boolean {
  return task.status === "completed";
}

export function isTaskOverdue(task: Pick<Task, "deadline" | "status">, now = new Date()): boolean {
  const deadline = normalizeDate(task.deadline);
  if (!deadline || isTaskCompleted(task)) return false;

  const dueEnd = new Date(`${deadline}T23:59:59`);
  return now > dueEnd;
}

export function getBaseXP(priority: TaskPriority): number {
  return XP_BY_PRIORITY[priority] ?? 15;
}

export function getDeadlineMultiplier(task: Pick<Task, "deadline" | "updatedAt">): number {
  const deadline = normalizeDate(task.deadline);
  if (!deadline) return 1;

  const completedDate = task.updatedAt ? new Date(task.updatedAt) : new Date();
  const dueStart = new Date(`${deadline}T00:00:00`);
  const dueEnd = new Date(`${deadline}T23:59:59`);

  if (completedDate < dueStart) return 1.25;
  if (completedDate <= dueEnd) return 1;
  return 0.5;
}

export function calculateTaskCompletionXP(task: Pick<Task, "priority" | "deadline" | "updatedAt">): number {
  return Math.round(getBaseXP(task.priority) * getDeadlineMultiplier(task));
}

export function calculateMissedDeadlinePenalty(task: Task, now = new Date()): number {
  if (!isTaskOverdue(task, now)) return 0;
  return -Math.round(getBaseXP(task.priority) * 0.3);
}

export function calculateTaskStats(tasks: Task[], now = new Date()): TaskStats {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(isTaskCompleted).length;
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task, now)).length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return {
    totalTasks,
    completedTasks,
    activeTasks: totalTasks - completedTasks,
    inProgressTasks,
    overdueTasks,
    completionRate,
    oceanHealth: completionRate,
  };
}

export function calculateGoalStats(goals: Goal[]): GoalStats {
  const totalGoals = goals.length;
  const completedGoals = goals.filter((goal) => goal.status === "completed").length;
  const averageProgress =
    totalGoals === 0
      ? 0
      : Math.round(goals.reduce((total, goal) => total + Number(goal.progress || 0), 0) / totalGoals);

  return {
    totalGoals,
    activeGoals: totalGoals - completedGoals,
    completedGoals,
    averageProgress,
  };
}

export function calculateTotalXP(tasks: Task[]): number {
  const totalXP = tasks.reduce((total, task) => {
    const taskXP = isTaskCompleted(task) ? calculateTaskCompletionXP(task) : 0;
    return total + taskXP + calculateMissedDeadlinePenalty(task);
  }, 0);

  return Math.max(0, Math.round(totalXP));
}

export function calculateLevel(totalXP: number): LevelInfo {
  const currentLevel = [...LEVELS].reverse().find((level) => totalXP >= level.startXP) ?? LEVELS[0];
  const nextLevelXP = currentLevel.nextLevelXP;
  const levelSpan = nextLevelXP === null ? 1 : nextLevelXP - currentLevel.startXP;

  return {
    currentLevelNumber: currentLevel.number,
    currentLevelName: currentLevel.name,
    currentLevelLabel: `Level ${currentLevel.number} ${currentLevel.name}`,
    currentLevelStartXP: currentLevel.startXP,
    nextLevelXP,
    xpNeededForNextLevel: nextLevelXP === null ? 0 : Math.max(nextLevelXP - totalXP, 0),
    isMaxLevel: nextLevelXP === null,
    levelProgressPercent:
      nextLevelXP === null ? 100 : Math.round(((totalXP - currentLevel.startXP) / levelSpan) * 100),
  };
}

export function getOceanStatus(health: number, totalTasks: number): OceanStatus {
  if (totalTasks === 0) return "empty";
  if (health === 100) return "thriving";
  if (health >= 71) return "healthy";
  if (health >= 31) return "recovering";
  return "polluted";
}

export function getOceanStatusLabel(status: OceanStatus): string {
  const labels: Record<OceanStatus, string> = {
    empty: "Empty Ocean",
    polluted: "Polluted",
    recovering: "Recovering",
    healthy: "Healthy",
    thriving: "Thriving",
  };
  return labels[status];
}

export function getOceanStatusMessage(status: OceanStatus): string {
  const messages: Record<OceanStatus, string> = {
    empty: "Create tasks to start restoring your productivity ocean.",
    polluted: "Several tasks still need attention. Complete work to clear the water.",
    recovering: "Your ocean is recovering. Keep moving tasks to completion.",
    healthy: "Your ocean is mostly restored, with only a little work left.",
    thriving: "All tracked tasks are complete. Your ocean is thriving.",
  };
  return messages[status];
}

export function flattenOceanItems(tasks: Task[]): OceanItem[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    deadline: normalizeDate(task.deadline),
    completed: isTaskCompleted(task),
    xpValue: calculateTaskCompletionXP(task),
    statusLabel: task.status.replace("_", " "),
  }));
}

export function calculateAchievements(input: {
  tasks: Task[];
  goals: Goal[];
  totalXP: number;
  levelInfo: LevelInfo;
  oceanHealth: number;
}): Achievement[] {
  const taskStats = calculateTaskStats(input.tasks);
  const goalStats = calculateGoalStats(input.goals);

  return [
    {
      name: "First Clear",
      description: "Complete your first tracked task.",
      unlocked: taskStats.completedTasks >= 1,
      accent: "emerald",
    },
    {
      name: "Goal Keeper",
      description: "Create at least three goals.",
      unlocked: goalStats.totalGoals >= 3,
      accent: "blue",
    },
    {
      name: "Clean Current",
      description: "Reach 70% task completion.",
      unlocked: input.oceanHealth >= 70,
      accent: "emerald",
    },
    {
      name: "Deep Focus",
      description: "Reach Level 3 through completed work.",
      unlocked: input.levelInfo.currentLevelNumber >= 3,
      accent: "amber",
    },
    {
      name: "Deadline Defender",
      description: "Keep overdue active tasks at zero.",
      unlocked: taskStats.totalTasks > 0 && taskStats.overdueTasks === 0,
      accent: "blue",
    },
    {
      name: "Ocean Guardian",
      description: "Restore the ocean to 100%.",
      unlocked: input.oceanHealth === 100 && taskStats.totalTasks > 0,
      accent: "rose",
    },
  ];
}
