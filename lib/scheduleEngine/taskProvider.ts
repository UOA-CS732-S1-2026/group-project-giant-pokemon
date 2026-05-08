import { getActiveMockTasks } from "@/lib/mockTasks";
import {
    DEFAULT_ESTIMATED_MINUTES,
    parseScheduleDate,
} from "@/lib/scheduler";
import type {
    SchedulableTask,
    SchedulableTaskPriority,
    SchedulableTaskStatus,
} from "@/lib/scheduleEngine/types";

const MAX_REQUEST_TASKS = 50;
const MAX_ESTIMATED_MINUTES = 480;

type InputTaskStatus = SchedulableTaskStatus | "completed";

type TaskProviderInput = {
    requestTasks?: unknown;
};

type TaskInputRecord = Record<string, unknown>;
type NormalizedTaskInput = Omit<SchedulableTask, "status"> & {
    status: InputTaskStatus;
};

export async function getSchedulableTasks({
    requestTasks,
}: TaskProviderInput = {}): Promise<SchedulableTask[]> {
    if (requestTasks !== undefined) {
        return normalizeRequestTasks(requestTasks);
    }

    return normalizeRequestTasks(await getActiveMockTasks());
}

export function normalizeRequestTasks(value: unknown): SchedulableTask[] {
    if (!Array.isArray(value)) {
        throw new Error("Tasks must be an array.");
    }

    if (value.length > MAX_REQUEST_TASKS) {
        throw new Error(`Tasks cannot contain more than ${MAX_REQUEST_TASKS} items.`);
    }

    const taskIds = new Set<string>();
    const tasks: SchedulableTask[] = [];

    for (const [index, task] of value.entries()) {
        if (!isPlainObject(task)) {
            throw new Error(`Task at index ${index} must be an object.`);
        }

        const normalizedTask = normalizeTask(task, index);

        if (taskIds.has(normalizedTask.id)) {
            throw new Error(`Duplicate task id: ${normalizedTask.id}.`);
        }

        taskIds.add(normalizedTask.id);

        if (normalizedTask.status === "completed") {
            continue;
        }

        tasks.push({
            id: normalizedTask.id,
            goalId: normalizedTask.goalId,
            title: normalizedTask.title,
            description: normalizedTask.description,
            status: normalizedTask.status,
            priority: normalizedTask.priority,
            deadline: normalizedTask.deadline,
            estimatedMinutes: normalizedTask.estimatedMinutes,
        });
    }

    return tasks;
}

function normalizeTask(task: TaskInputRecord, index: number): NormalizedTaskInput {
    const id = normalizeRequiredString(task.id, `Task at index ${index} must include id.`);
    const title = normalizeRequiredString(task.title, `Task ${id} must include title.`);
    const status = normalizeStatus(task.status, id);
    const priority = normalizePriority(task.priority, id);
    const deadline = normalizeDeadline(task.deadline, id);
    const estimatedMinutes = normalizeEstimatedMinutes(task.estimatedMinutes, id);

    return {
        id,
        goalId: normalizeOptionalString(task.goalId),
        title,
        description: normalizeOptionalString(task.description),
        status,
        priority,
        deadline,
        estimatedMinutes,
    };
}

function normalizeRequiredString(value: unknown, message: string) {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(message);
    }

    return value.trim();
}

function normalizeOptionalString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeStatus(value: unknown, taskId: string): InputTaskStatus {
    if (value === undefined || value === null || value === "") {
        return "todo";
    }

    if (value === "todo" || value === "in_progress" || value === "completed") {
        return value;
    }

    throw new Error(`Task ${taskId} status must be todo, in_progress, or completed.`);
}

function normalizePriority(value: unknown, taskId: string): SchedulableTaskPriority {
    if (value === "low" || value === "medium" || value === "high") {
        return value;
    }

    throw new Error(`Task ${taskId} priority must be low, medium, or high.`);
}

function normalizeDeadline(value: unknown, taskId: string) {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    if (typeof value !== "string" || !parseScheduleDate(value)) {
        throw new Error(`Task ${taskId} deadline must use YYYY-MM-DD format.`);
    }

    return value;
}

function normalizeEstimatedMinutes(value: unknown, taskId: string) {
    if (value === undefined || value === null || value === "") {
        return DEFAULT_ESTIMATED_MINUTES;
    }

    if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > MAX_ESTIMATED_MINUTES
    ) {
        throw new Error(
            `Task ${taskId} estimatedMinutes must be an integer from 1 to ${MAX_ESTIMATED_MINUTES}.`
        );
    }

    return value;
}

function isPlainObject(value: unknown): value is TaskInputRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
