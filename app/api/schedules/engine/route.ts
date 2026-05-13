import {
    DEMO_USER_ID,
    getTodayScheduleDate,
    parseScheduleDate,
} from "@/lib/scheduler";
import {
    generateAISchedule,
    generateRuleSchedule,
} from "@/lib/scheduleEngine";
import type {
    EngineOccupiedBlock,
    ScheduleGenerationMode,
    ScheduleWindowConfig,
    SchedulableTask,
} from "@/lib/scheduleEngine";

type EnginePreviewRequestBody = {
    date?: unknown;
    mode?: unknown;
    tasks?: unknown;
    occupiedBlocks?: unknown;
    instruction?: unknown;
    window?: unknown;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => ({}))) as EnginePreviewRequestBody;
        const scheduleDate = body.date
            ? parseScheduleDate(body.date)
            : getTodayScheduleDate();

        if (!scheduleDate) {
            return Response.json(
                { success: false, error: "Date must use YYYY-MM-DD format." },
                { status: 400 }
            );
        }

        const date = scheduleDate.toISOString().slice(0, 10);
        const mode = parseMode(body.mode);
        const tasks = parseTasks(body.tasks);
        const occupiedBlocks = parseOccupiedBlocks(body.occupiedBlocks);
        const instruction = parseOptionalString(body.instruction);
        const window = parseWindow(body.window);
        const input = {
            date,
            userId: DEMO_USER_ID,
            tasks,
            occupiedBlocks,
            window,
            instruction,
        };
        const result =
            mode === "ai"
                ? await generateAISchedule(input)
                : generateRuleSchedule(input);

        return Response.json(
            {
                success: true,
                data: result.blocks,
                meta: result.meta,
            },
            { status: 200 }
        );
    } catch (error) {
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 400 }
        );
    }
}

function parseMode(value: unknown): ScheduleGenerationMode {
    if (value === undefined || value === null || value === "") {
        return "rule";
    }

    if (value === "rule" || value === "ai") {
        return value;
    }

    throw new Error("Mode must be rule or ai.");
}

function parseTasks(value: unknown): SchedulableTask[] {
    if (!Array.isArray(value)) {
        throw new Error("Tasks must be an array.");
    }

    return value.map((task, index) => {
        if (!isPlainObject(task)) {
            throw new Error(`Task at index ${index} must be an object.`);
        }

        if (typeof task.id !== "string" || !task.id.trim()) {
            throw new Error(`Task at index ${index} must include id.`);
        }

        if (typeof task.title !== "string" || !task.title.trim()) {
            throw new Error(`Task ${task.id} must include title.`);
        }

        if (task.status !== "todo" && task.status !== "in_progress") {
            throw new Error(`Task ${task.id} status must be todo or in_progress.`);
        }

        if (
            task.priority !== "low" &&
            task.priority !== "medium" &&
            task.priority !== "high"
        ) {
            throw new Error(`Task ${task.id} priority must be low, medium, or high.`);
        }

        if (
            task.deadline !== undefined &&
            (typeof task.deadline !== "string" || !parseScheduleDate(task.deadline))
        ) {
            throw new Error(`Task ${task.id} deadline must use YYYY-MM-DD format.`);
        }

        if (
            typeof task.estimatedMinutes !== "number" ||
            !Number.isInteger(task.estimatedMinutes) ||
            task.estimatedMinutes <= 0
        ) {
            throw new Error(`Task ${task.id} estimatedMinutes must be a positive integer.`);
        }

        return {
            id: task.id,
            goalId: typeof task.goalId === "string" ? task.goalId : undefined,
            title: task.title.trim(),
            description:
                typeof task.description === "string" ? task.description : undefined,
            status: task.status,
            priority: task.priority,
            deadline: typeof task.deadline === "string" ? task.deadline : undefined,
            estimatedMinutes: task.estimatedMinutes,
        };
    });
}

function parseOccupiedBlocks(value: unknown): EngineOccupiedBlock[] {
    if (value === undefined || value === null) {
        return [];
    }

    if (!Array.isArray(value)) {
        throw new Error("Occupied blocks must be an array.");
    }

    return value.map((block, index) => {
        if (!isPlainObject(block)) {
            throw new Error(`Occupied block at index ${index} must be an object.`);
        }

        if (typeof block.title !== "string" || !block.title.trim()) {
            throw new Error(`Occupied block at index ${index} must include title.`);
        }

        if (typeof block.startTime !== "string" || typeof block.endTime !== "string") {
            throw new Error(`Occupied block ${block.title} must include times.`);
        }

        if (
            block.status !== "scheduled" &&
            block.status !== "completed" &&
            block.status !== "missed"
        ) {
            throw new Error(`Occupied block ${block.title} has invalid status.`);
        }

        return {
            taskId: typeof block.taskId === "string" ? block.taskId : undefined,
            title: block.title.trim(),
            startTime: block.startTime,
            endTime: block.endTime,
            status: block.status,
        };
    });
}

function parseWindow(value: unknown): Partial<ScheduleWindowConfig> | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isPlainObject(value)) {
        throw new Error("Window must be an object.");
    }

    return {
        normalStartTime:
            typeof value.normalStartTime === "string" ? value.normalStartTime : undefined,
        normalEndTime:
            typeof value.normalEndTime === "string" ? value.normalEndTime : undefined,
    };
}

function parseOptionalString(value: unknown) {
    return typeof value === "string" ? value.trim() : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
