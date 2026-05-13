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
    ScheduleTaskItem,
    ScheduleWindowConfig,
    SchedulableTask,
} from "@/lib/scheduleEngine/types";
import type { ScheduleBlockAPI } from "@/types/schedule";

const defaultWindow: ScheduleWindowConfig = {
    normalStartTime: DEFAULT_START_TIME,
    normalEndTime: DEFAULT_END_TIME,
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
        !hasValidTimeRange(resolvedWindow.normalStartTime, resolvedWindow.normalEndTime)
    ) {
        throw new Error("Mock schedule engine received an invalid schedule window.");
    }

    const normalStart = timeToMinutes(resolvedWindow.normalStartTime);
    const normalEnd = timeToMinutes(resolvedWindow.normalEndTime);
    const occupiedRanges = toOccupiedRanges(occupiedBlocks);
    const scheduledBlocks: ScheduleBlockAPI[] = [];
    const unscheduled: ScheduleTaskItem[] = [];
    let cursor = normalStart;

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

            continue;
        }

        unscheduled.push({
            taskId: task.id,
            title: task.title,
        });
    }

    scheduledBlocks.sort((first, second) => first.startTime.localeCompare(second.startTime));

    return {
        success: true,
        data: scheduledBlocks,
        meta: {
            requestedMode: mode,
            usedMode: mode,
            scheduleSummary:
                mode === "ai"
                    ? "Mock AI scheduled tasks into available slots within the normal window."
                    : "Mock rule engine scheduled tasks into available slots.",
            instructionDeviations: [],
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
