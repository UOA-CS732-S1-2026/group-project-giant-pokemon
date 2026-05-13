import { isAIClientError } from "@/lib/ai/errors";
import { parseAIJson, runPrompt } from "@/lib/ai";
import { buildAISchedulePrompt } from "@/lib/ai/prompts/schedulePrompt";
import type { AIEnv } from "@/lib/ai/config";
import type { AIResult, FetchFunction } from "@/lib/ai/types";
import {
    DEMO_USER_ID,
    minutesToTime,
    timeToMinutes,
} from "@/lib/scheduler";
import {
    generateRuleSchedule,
    resolveScheduleWindow,
} from "@/lib/scheduleEngine/ruleEngine";
import type {
    EngineGeneratedBlock,
    EngineOccupiedBlock,
    ScheduleEngineResult,
    ScheduleGenerationFallbackCode,
    ScheduleTaskItem,
    ScheduleWindowConfig,
    SchedulableTask,
} from "@/lib/scheduleEngine/types";

type AIEngineInput = {
    date: string;
    userId?: string;
    tasks: SchedulableTask[];
    occupiedBlocks?: EngineOccupiedBlock[];
    window?: Partial<ScheduleWindowConfig>;
    instruction?: string;
};

type AIRunner = (
    request: {
        prompt: string;
        responseMimeType: "application/json";
        temperature: number;
    },
    options: {
        env?: AIEnv;
        fetchFn?: FetchFunction;
    }
) => Promise<AIResult>;

type AIEngineOptions = {
    env?: AIEnv;
    fetchFn?: FetchFunction;
    runPrompt?: AIRunner;
};

type AIScheduleResponse = {
    summary?: unknown;
    instructionDeviations?: unknown;
    sequence?: unknown;
    unscheduled?: Array<{
        taskId?: unknown;
    }>;
};

type TimeRange = {
    start: number;
    end: number;
};

export { buildAISchedulePrompt } from "@/lib/ai/prompts/schedulePrompt";

export async function generateAISchedule(
    input: AIEngineInput,
    options: AIEngineOptions = {}
): Promise<ScheduleEngineResult> {
    const prompt = buildAISchedulePrompt(input);
    const promptRunner = options.runPrompt ?? runPrompt;

    try {
        const aiResult = await promptRunner(
            {
                prompt,
                responseMimeType: "application/json",
                temperature: 0.2,
            },
            {
                env: options.env,
                fetchFn: options.fetchFn,
            }
        );
        const parsed = parseAIJson<AIScheduleResponse>(aiResult.text);

        return validateAIOutput({
            ...input,
            output: parsed,
        });
    } catch (error) {
        return createFallbackResult({
            input,
            error,
        });
    }
}

export function validateAIOutput({
    date,
    userId = DEMO_USER_ID,
    tasks,
    occupiedBlocks = [],
    window,
    output,
}: AIEngineInput & {
    output: AIScheduleResponse;
}): ScheduleEngineResult {
    const resolvedWindow = resolveScheduleWindow(window);
    const normalStart = timeToMinutes(resolvedWindow.normalStartTime);
    const normalEnd = timeToMinutes(resolvedWindow.normalEndTime);
    const tasksById = new Map(tasks.map((task) => [task.id, task]));
    const scheduleSummary = normalizeSummary(output.summary);
    const instructionDeviations = normalizeInstructionDeviations(
        output.instructionDeviations
    );
    const unscheduled = normalizeUnscheduledItems(output.unscheduled, tasksById);
    const sequence = normalizeSequence(output.sequence, tasksById);
    const occupiedRanges = toOccupiedRanges(occupiedBlocks);
    const unscheduledTaskIds = new Set(unscheduled.map((item) => item.taskId));
    const sequenceTaskIds = new Set<string>();
    const tasksToSchedule: SchedulableTask[] = [];

    for (const taskId of sequence) {
        if (unscheduledTaskIds.has(taskId)) {
            throw new Error(`AI marked task ${taskId} as both sequenced and unscheduled.`);
        }

        sequenceTaskIds.add(taskId);
        tasksToSchedule.push(tasksById.get(taskId)!);
    }

    for (const task of tasks) {
        const sequenced = sequenceTaskIds.has(task.id);
        const markedUnscheduled = unscheduledTaskIds.has(task.id);

        if (!sequenced && !markedUnscheduled) {
            throw new Error(`AI did not account for task ${task.id}.`);
        }
    }

    const scheduleBuild = buildBlocksFromSequence({
        date,
        userId,
        tasks: tasksToSchedule,
        unscheduled,
        occupiedRanges,
        normalStart,
        normalEnd,
    });

    return {
        blocks: scheduleBuild.blocks,
        meta: {
            requestedMode: "ai",
            usedMode: "ai",
            scheduleSummary,
            instructionDeviations,
            unscheduled: scheduleBuild.unscheduled,
        },
    };
}

function createFallbackResult({
    input,
    error,
}: {
    input: AIEngineInput;
    error: unknown;
}): ScheduleEngineResult {
    const baseline = generateRuleSchedule(input);

    return {
        blocks: baseline.blocks,
        meta: {
            ...baseline.meta,
            requestedMode: "ai",
            usedMode: "rule",
            fallback: {
                code: getFallbackCode(error),
                message: getFallbackMessage(error),
            },
        },
    };
}

function getFallbackCode(error: unknown): ScheduleGenerationFallbackCode {
    if (isAIClientError(error)) {
        return error.code;
    }

    if (error instanceof SyntaxError) {
        return "invalid_response";
    }

    return "validation_failed";
}

function getFallbackMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "AI schedule generation failed validation.";
}

function normalizeSummary(value: unknown) {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error("AI response must include summary.");
    }

    return value.trim();
}

function normalizeInstructionDeviations(value: unknown) {
    return assertArray(value, "instructionDeviations").map((item) => {
        if (typeof item !== "string" || !item.trim()) {
            throw new Error("AI instructionDeviations items must be non-empty strings.");
        }

        return item.trim();
    });
}

function normalizeUnscheduledItems(
    value: AIScheduleResponse["unscheduled"],
    tasksById: Map<string, SchedulableTask>
): ScheduleTaskItem[] {
    const seenTaskIds = new Set<string>();

    return assertArray(value, "unscheduled").map((item) => {
        if (!isPlainObject(item) || typeof item.taskId !== "string") {
            throw new Error("AI unscheduled items must include taskId.");
        }

        const task = tasksById.get(item.taskId);

        if (!task) {
            throw new Error(`AI unscheduled referenced unknown task id: ${item.taskId}.`);
        }

        if (seenTaskIds.has(task.id)) {
            throw new Error(`AI returned duplicate unscheduled item for task ${task.id}.`);
        }

        seenTaskIds.add(task.id);

        return {
            taskId: task.id,
            title: task.title,
        };
    });
}

function normalizeSequence(
    value: AIScheduleResponse["sequence"],
    tasksById: Map<string, SchedulableTask>
): string[] {
    const seenTaskIds = new Set<string>();

    return assertArray(value, "sequence").map((item) => {
        if (typeof item !== "string") {
            throw new Error("AI sequence items must be task ids.");
        }

        const task = tasksById.get(item);

        if (!task) {
            throw new Error(`AI sequence referenced unknown task id: ${item}.`);
        }

        if (seenTaskIds.has(task.id)) {
            throw new Error(`AI returned duplicate sequence item for task ${task.id}.`);
        }

        seenTaskIds.add(task.id);

        return task.id;
    });
}

function buildBlocksFromSequence({
    date,
    userId,
    tasks,
    unscheduled,
    occupiedRanges,
    normalStart,
    normalEnd,
}: {
    date: string;
    userId: string;
    tasks: SchedulableTask[];
    unscheduled: ScheduleTaskItem[];
    occupiedRanges: TimeRange[];
    normalStart: number;
    normalEnd: number;
}) {
    const blocks: EngineGeneratedBlock[] = [];
    const resolvedUnscheduled = [...unscheduled];
    let cursor = normalStart;

    for (const task of tasks) {
        const start = findNextAvailableStart({
            cursor,
            duration: task.estimatedMinutes,
            windowStart: normalStart,
            windowEnd: normalEnd,
            occupiedRanges,
        });

        if (start === null) {
            resolvedUnscheduled.push({
                taskId: task.id,
                title: task.title,
            });
            continue;
        }

        const end = start + task.estimatedMinutes;

        blocks.push({
            userId,
            taskId: task.id,
            title: task.title,
            date: `${date}T00:00:00.000Z`,
            startTime: minutesToTime(start),
            endTime: minutesToTime(end),
            status: "scheduled",
        });
        cursor = end;
    }

    return {
        blocks,
        unscheduled: resolvedUnscheduled,
    };
}

function assertArray<T = unknown>(value: unknown, fieldName: string): T[] {
    if (!Array.isArray(value)) {
        throw new Error(`AI response must include ${fieldName} array.`);
    }

    return value as T[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toOccupiedRanges(blocks: EngineOccupiedBlock[]): TimeRange[] {
    return blocks
        .filter((block) => block.status === "scheduled" || block.status === "completed")
        .map((block) => ({
            start: timeToMinutes(block.startTime),
            end: timeToMinutes(block.endTime),
        }))
        .filter((range) => range.start < range.end)
        .sort((first, second) => first.start - second.start);
}

function findNextAvailableStart({
    cursor,
    duration,
    windowStart,
    windowEnd,
    occupiedRanges,
}: {
    cursor: number;
    duration: number;
    windowStart: number;
    windowEnd: number;
    occupiedRanges: TimeRange[];
}) {
    let nextStart = Math.max(cursor, windowStart);

    for (const range of occupiedRanges) {
        if (range.end <= windowStart || range.start >= windowEnd) {
            continue;
        }

        const occupiedStart = Math.max(range.start, windowStart);
        const occupiedEnd = Math.min(range.end, windowEnd);

        if (nextStart + duration <= occupiedStart) {
            return nextStart + duration <= windowEnd ? nextStart : null;
        }

        if (nextStart >= occupiedStart && nextStart < occupiedEnd) {
            nextStart = occupiedEnd;
        }
    }

    return nextStart + duration <= windowEnd ? nextStart : null;
}
