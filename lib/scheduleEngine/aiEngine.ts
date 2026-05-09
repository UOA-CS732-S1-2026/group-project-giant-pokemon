import { isAIClientError } from "@/lib/ai/errors";
import { parseAIJson, runPrompt } from "@/lib/ai";
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
    ScheduleMetaItem,
    ScheduleReasoningItem,
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
    blocks?: Array<{
        taskId?: unknown;
        startTime?: unknown;
        endTime?: unknown;
    }>;
    scheduledReasoning?: Array<{
        taskId?: unknown;
        reasoning?: unknown;
    }>;
    overflow?: Array<{
        taskId?: unknown;
        reason?: unknown;
    }>;
    unscheduled?: Array<{
        taskId?: unknown;
        reason?: unknown;
    }>;
};

type TimeRange = {
    start: number;
    end: number;
};

export async function generateAISchedule(
    input: AIEngineInput,
    options: AIEngineOptions = {}
): Promise<ScheduleEngineResult> {
    const baseline = generateRuleSchedule(input);
    const prompt = buildAISchedulePrompt({
        ...input,
        baseline,
    });
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
            baseline,
            output: parsed,
        });
    } catch (error) {
        return createFallbackResult({
            baseline,
            error,
        });
    }
}

export function buildAISchedulePrompt({
    date,
    userId = DEMO_USER_ID,
    tasks,
    occupiedBlocks = [],
    window,
    instruction,
    baseline,
}: AIEngineInput & { baseline: ScheduleEngineResult }): string {
    const resolvedWindow = resolveScheduleWindow(window);
    const normalizedInstruction = normalizeInstruction(instruction);

    return [
        "You are the Taskflow schedule engine AI mode.",
        "Return JSON only. Do not include markdown or prose outside JSON.",
        "Your job is to adjust the deterministic rule baseline only when the user instruction justifies it.",
        "Keep the same public output contract as the rule engine.",
        "",
        "Hard constraints:",
        "- Use only provided task ids.",
        "- Do not create, rename, split, or resize tasks.",
        "- Each scheduled task appears at most once.",
        "- Schedule blocks must not overlap each other.",
        "- Schedule blocks must not overlap occupied blocks.",
        "- Fixed or completed occupied blocks cannot move.",
        "- Only tasks with deadline on or before the schedule date may go after the normal window.",
        "- No task can end after the overflow cap.",
        "- Use HH:mm times.",
        "- Every scheduled task requires reasoning.",
        "",
        "Strong preferences:",
        "- Higher priority tasks are generally earlier.",
        "- Earlier deadlines are generally earlier.",
        "- Must-complete-today tasks should be scheduled if any valid slot exists.",
        "",
        "Soft preferences may follow the user instruction when safe.",
        "",
        `User id: ${userId}`,
        `Schedule date: ${date}`,
        `Normal window: ${resolvedWindow.normalStartTime}-${resolvedWindow.normalEndTime}`,
        `Overflow cap: ${resolvedWindow.overflowEndTime}`,
        `User instruction: ${normalizedInstruction || "No instruction provided. Stay close to the rule baseline."}`,
        "",
        "Tasks JSON:",
        JSON.stringify(tasks),
        "",
        "Occupied blocks JSON:",
        JSON.stringify(occupiedBlocks),
        "",
        "Rule baseline JSON:",
        JSON.stringify(baseline),
        "",
        "Return this exact JSON shape:",
        JSON.stringify({
            blocks: [
                {
                    taskId: "task-id",
                    startTime: "09:00",
                    endTime: "10:00",
                },
            ],
            scheduledReasoning: [
                {
                    taskId: "task-id",
                    reasoning: "Why this task was placed here, including any meaningful deviation from the rule baseline.",
                },
            ],
            overflow: [
                {
                    taskId: "task-id",
                    reason: "Why this task was placed after the normal window.",
                },
            ],
            unscheduled: [
                {
                    taskId: "task-id",
                    reason: "Why this task could not be scheduled.",
                },
            ],
        }),
    ].join("\n");
}

export function validateAIOutput({
    date,
    userId = DEMO_USER_ID,
    tasks,
    occupiedBlocks = [],
    window,
    output,
}: AIEngineInput & {
    baseline: ScheduleEngineResult;
    output: AIScheduleResponse;
}): ScheduleEngineResult {
    const resolvedWindow = resolveScheduleWindow(window);
    const normalStart = timeToMinutes(resolvedWindow.normalStartTime);
    const normalEnd = timeToMinutes(resolvedWindow.normalEndTime);
    const overflowEnd = timeToMinutes(resolvedWindow.overflowEndTime);
    const tasksById = new Map(tasks.map((task) => [task.id, task]));
    const blocks = assertArray(output.blocks, "blocks");
    const reasoning = normalizeReasoning(output.scheduledReasoning, tasksById);
    const overflow = normalizeMetaItems(output.overflow, tasksById, "overflow");
    const unscheduled = normalizeMetaItems(output.unscheduled, tasksById, "unscheduled");
    const occupiedRanges = toOccupiedRanges(occupiedBlocks);
    const generatedBlocks: EngineGeneratedBlock[] = [];
    const scheduledTaskIds = new Set<string>();
    const unscheduledTaskIds = new Set(unscheduled.map((item) => item.taskId));
    const overflowTaskIds = new Set(overflow.map((item) => item.taskId));
    const reasoningTaskIds = new Set(reasoning.map((item) => item.taskId));

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

        if (end > overflowEnd) {
            throw new Error(`AI scheduled task ${task.id} after overflow cap.`);
        }

        if (end > normalEnd && !isMustCompleteToday(task, date)) {
            throw new Error(`AI overflowed non-must-complete task ${task.id}.`);
        }

        if (end > normalEnd && !overflowTaskIds.has(task.id)) {
            throw new Error(`AI overflowed task ${task.id} without overflow reason.`);
        }

        if (start < normalStart) {
            throw new Error(`AI scheduled task ${task.id} before normal window.`);
        }

        if (!reasoningTaskIds.has(task.id)) {
            throw new Error(`AI scheduled task ${task.id} without reasoning.`);
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

    for (const item of overflow) {
        const generatedBlock = generatedBlocks.find((block) => block.taskId === item.taskId);

        if (!generatedBlock || timeToMinutes(generatedBlock.endTime) <= normalEnd) {
            throw new Error(`AI returned overflow reason for non-overflow task ${item.taskId}.`);
        }
    }

    for (const item of reasoning) {
        if (!scheduledTaskIds.has(item.taskId)) {
            throw new Error(`AI returned reasoning for non-scheduled task ${item.taskId}.`);
        }
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
            scheduledReasoning: reasoning,
            overflow,
            unscheduled,
        },
    };
}

function createFallbackResult({
    baseline,
    error,
}: {
    baseline: ScheduleEngineResult;
    error: unknown;
}): ScheduleEngineResult {
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

function normalizeInstruction(instruction: string | undefined) {
    return instruction?.trim().slice(0, 1_000) ?? "";
}

function normalizeReasoning(
    value: AIScheduleResponse["scheduledReasoning"],
    tasksById: Map<string, SchedulableTask>
): ScheduleReasoningItem[] {
    const seenTaskIds = new Set<string>();

    return assertArray(value, "scheduledReasoning").map((item) => {
        if (
            !isPlainObject(item) ||
            typeof item.taskId !== "string" ||
            typeof item.reasoning !== "string" ||
            !item.reasoning.trim()
        ) {
            throw new Error("AI scheduledReasoning items must include taskId and reasoning.");
        }

        const task = tasksById.get(item.taskId);

        if (!task) {
            throw new Error(`AI reasoning referenced unknown task id: ${item.taskId}.`);
        }

        if (seenTaskIds.has(task.id)) {
            throw new Error(`AI returned duplicate reasoning for task ${task.id}.`);
        }

        seenTaskIds.add(task.id);

        return {
            taskId: task.id,
            title: task.title,
            reasoning: item.reasoning.trim(),
        };
    });
}

function normalizeMetaItems(
    value: AIScheduleResponse["overflow"] | AIScheduleResponse["unscheduled"],
    tasksById: Map<string, SchedulableTask>,
    fieldName: "overflow" | "unscheduled"
): ScheduleMetaItem[] {
    const seenTaskIds = new Set<string>();

    return assertArray(value, fieldName).map((item) => {
        if (
            !isPlainObject(item) ||
            typeof item.taskId !== "string" ||
            typeof item.reason !== "string" ||
            !item.reason.trim()
        ) {
            throw new Error(`AI ${fieldName} items must include taskId and reason.`);
        }

        const task = tasksById.get(item.taskId);

        if (!task) {
            throw new Error(`AI ${fieldName} referenced unknown task id: ${item.taskId}.`);
        }

        if (seenTaskIds.has(task.id)) {
            throw new Error(`AI returned duplicate ${fieldName} item for task ${task.id}.`);
        }

        seenTaskIds.add(task.id);

        return {
            taskId: task.id,
            title: task.title,
            reason: item.reason.trim(),
        };
    });
}

function assertArray<T>(value: T[] | undefined, fieldName: string): T[] {
    if (!Array.isArray(value)) {
        throw new Error(`AI response must include ${fieldName} array.`);
    }

    return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMustCompleteToday(task: SchedulableTask, date: string) {
    return Boolean(task.deadline && task.deadline <= date);
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
