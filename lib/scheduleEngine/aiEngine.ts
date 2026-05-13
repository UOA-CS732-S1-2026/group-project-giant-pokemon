import { isAIClientError } from "@/lib/ai/errors";
import { parseAIJson, runPrompt } from "@/lib/ai";
import { buildAISchedulePrompt } from "@/lib/ai/prompts/schedulePrompt";
import type { AIEnv } from "@/lib/ai/config";
import type { AIResult, FetchFunction } from "@/lib/ai/types";
import {
    DEMO_USER_ID,
    hasValidTimeRange,
    isTimeString,
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
    blocks?: Array<{
        taskId?: unknown;
        startTime?: unknown;
        endTime?: unknown;
    }>;
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
    const blocks = assertArray(output.blocks, "blocks");
    const unscheduled = normalizeUnscheduledItems(output.unscheduled, tasksById);
    const occupiedRanges = toOccupiedRanges(occupiedBlocks);
    const generatedBlocks: EngineGeneratedBlock[] = [];
    const scheduledTaskIds = new Set<string>();
    const unscheduledTaskIds = new Set(unscheduled.map((item) => item.taskId));

    for (const block of blocks) {
        if (!isPlainObject(block) || typeof block.taskId !== "string") {
            throw new Error("AI scheduled blocks must include taskId.");
        }

        const task = tasksById.get(block.taskId);

        if (!task) {
            throw new Error(`AI scheduled unknown task id: ${block.taskId}.`);
        }

        if (scheduledTaskIds.has(task.id)) {
            throw new Error(`AI scheduled task more than once: ${task.id}.`);
        }

        if (!isTimeString(block.startTime) || !isTimeString(block.endTime)) {
            throw new Error(`AI scheduled task ${task.id} with invalid time format.`);
        }

        if (!hasValidTimeRange(block.startTime, block.endTime)) {
            throw new Error(`AI scheduled task ${task.id} with invalid time range.`);
        }

        const start = timeToMinutes(block.startTime);
        const end = timeToMinutes(block.endTime);

        if (end - start !== task.estimatedMinutes) {
            throw new Error(`AI changed duration for task ${task.id}.`);
        }

        if (end > normalEnd) {
            throw new Error(`AI scheduled task ${task.id} after normal window.`);
        }

        if (start < normalStart) {
            throw new Error(`AI scheduled task ${task.id} before normal window.`);
        }

        generatedBlocks.push({
            userId,
            taskId: task.id,
            title: task.title,
            date: `${date}T00:00:00.000Z`,
            startTime: block.startTime,
            endTime: block.endTime,
            status: "scheduled",
        });
        scheduledTaskIds.add(task.id);
    }

    const generatedRanges = toGeneratedRanges(generatedBlocks);

    if (hasOverlap(generatedRanges) || overlapsAny(generatedRanges, occupiedRanges)) {
        throw new Error("AI schedule overlaps occupied or generated blocks.");
    }

    for (const task of tasks) {
        const scheduled = scheduledTaskIds.has(task.id);
        const markedUnscheduled = unscheduledTaskIds.has(task.id);

        if (scheduled && markedUnscheduled) {
            throw new Error(`AI marked task ${task.id} as both scheduled and unscheduled.`);
        }

        if (!scheduled && !markedUnscheduled) {
            throw new Error(`AI did not account for task ${task.id}.`);
        }
    }

    generatedBlocks.sort((first, second) => first.startTime.localeCompare(second.startTime));

    return {
        blocks: generatedBlocks,
        meta: {
            requestedMode: "ai",
            usedMode: "ai",
            scheduleSummary,
            instructionDeviations,
            unscheduled,
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

function toGeneratedRanges(blocks: EngineGeneratedBlock[]): TimeRange[] {
    return blocks.map((block) => ({
        start: timeToMinutes(block.startTime),
        end: timeToMinutes(block.endTime),
    }));
}

function hasOverlap(ranges: TimeRange[]) {
    const sortedRanges = [...ranges].sort((first, second) => first.start - second.start);

    for (let index = 1; index < sortedRanges.length; index += 1) {
        if (sortedRanges[index].start < sortedRanges[index - 1].end) {
            return true;
        }
    }

    return false;
}

function overlapsAny(firstRanges: TimeRange[], secondRanges: TimeRange[]) {
    return firstRanges.some((first) =>
        secondRanges.some(
            (second) => first.start < second.end && second.start < first.end
        )
    );
}
