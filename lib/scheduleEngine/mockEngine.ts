import {
    DEFAULT_END_TIME,
    DEFAULT_START_TIME,
    DEMO_USER_ID,
    hasValidTimeRange,
    minutesToTime,
    parseScheduleDate,
    timeToMinutes,
} from "@/lib/scheduler";
import type {
    EngineOccupiedBlock,
    MockScheduleEngineResponse,
    ScheduleGenerationMode,
    ScheduleMetaItem,
    ScheduleReasoningItem,
    ScheduleWindowConfig,
    SchedulableTask,
} from "@/lib/scheduleEngine/types";
import type { ScheduleBlockAPI } from "@/types/schedule";

const DEFAULT_OVERFLOW_END_TIME = "22:00";

const defaultWindow: ScheduleWindowConfig = {
    normalStartTime: DEFAULT_START_TIME,
    normalEndTime: DEFAULT_END_TIME,
    overflowEndTime: DEFAULT_OVERFLOW_END_TIME,
};

export type MockScheduleEngineInput = {
    date: string;
    mode?: ScheduleGenerationMode;
    userId?: string;
    tasks: SchedulableTask[];
    occupiedBlocks?: EngineOccupiedBlock[];
    window?: Partial<ScheduleWindowConfig>;
};

export function createMockScheduleEngineResponse({
    date,
    mode = "rule",
    userId = DEMO_USER_ID,
    tasks,
    occupiedBlocks = [],
    window,
}: MockScheduleEngineInput): MockScheduleEngineResponse {
    const scheduleDate = parseScheduleDate(date);

    if (!scheduleDate) {
        throw new Error("Mock schedule engine date must use YYYY-MM-DD format.");
    }

    const resolvedWindow = {
        ...defaultWindow,
        ...window,
    };

    if (
        !hasValidTimeRange(resolvedWindow.normalStartTime, resolvedWindow.normalEndTime) ||
        !hasValidTimeRange(resolvedWindow.normalEndTime, resolvedWindow.overflowEndTime)
    ) {
        throw new Error("Mock schedule engine received an invalid schedule window.");
    }

    const normalStart = timeToMinutes(resolvedWindow.normalStartTime);
    const normalEnd = timeToMinutes(resolvedWindow.normalEndTime);
    const overflowEnd = timeToMinutes(resolvedWindow.overflowEndTime);
    const occupiedRanges = toOccupiedRanges(occupiedBlocks);
    const scheduledBlocks: ScheduleBlockAPI[] = [];
    const scheduledReasoning: ScheduleReasoningItem[] = [];
    const overflow: ScheduleMetaItem[] = [];
    const unscheduled: ScheduleMetaItem[] = [];
    let cursor = normalStart;
    let overflowCursor = normalEnd;

    for (const task of tasks) {
        const duration = task.estimatedMinutes;
        const nextStart = findNextAvailableStart(cursor, duration, normalEnd, occupiedRanges);

        if (nextStart !== null) {
            const block = createBlock({
                userId,
                date,
                task,
                startMinutes: nextStart,
                duration,
            });
            scheduledBlocks.push(block);
            cursor = timeToMinutes(block.endTime);

            if (mode === "ai") {
                scheduledReasoning.push({
                    taskId: task.id,
                    title: task.title,
                    reasoning: "Mock AI reasoning: task was scheduled in the normal work window.",
                });
            }

            continue;
        }

        const mustCompleteToday = isMustCompleteToday(task, date);

        if (!mustCompleteToday) {
            unscheduled.push({
                taskId: task.id,
                title: task.title,
                reason: "Task could not fit before 17:00 and is not due on or before the schedule date.",
            });
            continue;
        }

        if (overflowCursor + duration <= overflowEnd) {
            const block = createBlock({
                userId,
                date,
                task,
                startMinutes: overflowCursor,
                duration,
            });
            scheduledBlocks.push(block);
            overflowCursor = timeToMinutes(block.endTime);
            overflow.push({
                taskId: task.id,
                title: task.title,
                reason: "Task is due on or before the schedule date, so it was placed after 17:00.",
            });

            if (mode === "ai") {
                scheduledReasoning.push({
                    taskId: task.id,
                    title: task.title,
                    reasoning: "Mock AI reasoning: task was scheduled in overflow because it must be completed today.",
                });
            }

            continue;
        }

        unscheduled.push({
            taskId: task.id,
            title: task.title,
            reason: "Task must be completed today, but it cannot fit before the 22:00 overflow cap.",
        });
    }

    scheduledBlocks.sort((first, second) => first.startTime.localeCompare(second.startTime));

    return {
        success: true,
        data: scheduledBlocks,
        meta: {
            requestedMode: mode,
            usedMode: mode,
            scheduledReasoning,
            overflow,
            unscheduled,
        },
    };
}

function createBlock({
    userId,
    date,
    task,
    startMinutes,
    duration,
}: {
    userId: string;
    date: string;
    task: SchedulableTask;
    startMinutes: number;
    duration: number;
}): ScheduleBlockAPI {
    const now = new Date().toISOString();

    return {
        _id: `mock-block-${task.id}`,
        userId,
        taskId: task.id,
        title: task.title,
        date: `${date}T00:00:00.000Z`,
        startTime: minutesToTime(startMinutes),
        endTime: minutesToTime(startMinutes + duration),
        status: "scheduled",
        createdAt: now,
        updatedAt: now,
    };
}

function isMustCompleteToday(task: SchedulableTask, date: string) {
    return Boolean(task.deadline && task.deadline <= date);
}

function toOccupiedRanges(blocks: EngineOccupiedBlock[]) {
    return blocks
        .filter((block) => block.status === "scheduled" || block.status === "completed")
        .map((block) => ({
            start: timeToMinutes(block.startTime),
            end: timeToMinutes(block.endTime),
        }))
        .filter((range) => range.start < range.end)
        .sort((first, second) => first.start - second.start);
}

function findNextAvailableStart(
    cursor: number,
    duration: number,
    normalEnd: number,
    occupiedRanges: Array<{ start: number; end: number }>
) {
    let nextStart = cursor;

    for (const range of occupiedRanges) {
        if (nextStart + duration <= range.start) {
            return nextStart + duration <= normalEnd ? nextStart : null;
        }

        if (nextStart >= range.start && nextStart < range.end) {
            nextStart = range.end;
        }
    }

    return nextStart + duration <= normalEnd ? nextStart : null;
}

