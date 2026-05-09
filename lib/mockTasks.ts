export type MockTaskStatus = "todo" | "in_progress" | "completed";
export type MockTaskPriority = "low" | "medium" | "high";

export type MockTask = {
    id: string;
    goalId?: string;
    title: string;
    status: MockTaskStatus;
    priority: MockTaskPriority;
    deadline?: string;
    estimatedMinutes?: number;
};

const mockTasks: MockTask[] = [
    {
        id: "task-1",
        goalId: "goal-study",
        title: "Review lecture notes",
        status: "todo",
        priority: "high",
        deadline: "2026-05-06",
        estimatedMinutes: 90,
    },
    {
        id: "task-2",
        goalId: "goal-project",
        title: "Implement API validation",
        status: "in_progress",
        priority: "high",
        deadline: "2026-05-08",
        estimatedMinutes: 120,
    },
    {
        id: "task-3",
        goalId: "goal-project",
        title: "Write module test notes",
        status: "todo",
        priority: "medium",
        deadline: "2026-05-10",
        estimatedMinutes: 60,
    },
    {
        id: "task-4",
        goalId: "goal-health",
        title: "Plan weekly workout",
        status: "todo",
        priority: "low",
        estimatedMinutes: 45,
    },
    {
        id: "task-5",
        goalId: "goal-study",
        title: "Submit completed practice quiz",
        status: "completed",
        priority: "medium",
        deadline: "2026-05-05",
        estimatedMinutes: 30,
    },
];

export async function getActiveMockTasks(): Promise<MockTask[]> {
    return mockTasks.filter((task) => task.status !== "completed");
}

export async function getActiveMockTasksByIds(taskIds: string[]): Promise<MockTask[]> {
    const taskIdSet = new Set(taskIds);

    return mockTasks.filter(
        (task) => task.status !== "completed" && taskIdSet.has(task.id)
    );
}

