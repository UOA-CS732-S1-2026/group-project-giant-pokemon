import {
    DEFAULT_END_TIME,
    DEFAULT_START_TIME,
    DEMO_USER_ID,
    hasValidTimeRange,
    isTimeString,
    minutesToTime,
    timeToMinutes,
} from "@/lib/scheduler";
import type {
    EngineGeneratedBlock,
    EngineOccupiedBlock,
    ScheduleEngineResult,
    ScheduleGenerationMeta,
    ScheduleTaskItem,
    ScheduleWindowConfig,
    SchedulableTask,
} from "@/lib/scheduleEngine/types";

export const defaultScheduleWindow: ScheduleWindowConfig = {
    normalStartTime: DEFAULT_START_TIME,
    normalEndTime: DEFAULT_END_TIME,
};

type RuleEngineInput = {
    date: string;
    userId?: string;
    tasks: SchedulableTask[];
    occupiedBlocks?: EngineOccupiedBlock[];
    window?: Partial<ScheduleWindowConfig>;
};

type TimeRange = {
    start: number;
    end: number;
};

const priorityRank: Record<SchedulableTask["priority"], number> = {
    high: 3,
    medium: 2,
    low: 1,
};

export function generateRuleSchedule({
    date,
    userId = DEMO_USER_ID,
    tasks,
    occupiedBlocks = [],
    window,
}: RuleEngineInput): ScheduleEngineResult {
    const resolvedWindow = resolveScheduleWindow(window);
    const normalStart = timeToMinutes(resolvedWindow.normalStartTime);
    const normalEnd = timeToMinutes(resolvedWindow.normalEndTime);
    const occupiedRanges = toOccupiedRanges(occupiedBlocks);
    const blocks: EngineGeneratedBlock[] = [];
    const unscheduled: ScheduleTaskItem[] = [];
    let normalCursor = normalStart;

    for (const task of sortTasksForRuleEngine(tasks)) {
        const normalStartTime = findNextAvailableStart({
            cursor: normalCursor,
            duration: task.estimatedMinutes,
            windowStart: normalStart,
            windowEnd: normalEnd,
            occupiedRanges,
        });

        if (normalStartTime !== null) {
            blocks.push(createGeneratedBlock({ userId, date, task, start: normalStartTime }));
            normalCursor = normalStartTime + task.estimatedMinutes;
            continue;
        }

        unscheduled.push({
            taskId: task.id,
            title: task.title,
        });
    }

    blocks.sort((first, second) => first.startTime.localeCompare(second.startTime));

    return {
        blocks,
        meta: createRuleMeta({ unscheduled }),
    };
}

export function sortTasksForRuleEngine(tasks: SchedulableTask[]): SchedulableTask[] {
    return tasks
        .map((task, index) => ({ task, index }))
        .sort((first, second) => {
            const priorityDifference =
                priorityRank[second.task.priority] - priorityRank[first.task.priority];

            if (priorityDifference !== 0) {
                return priorityDifference;
            }

            const firstDeadline = deadlineRank(first.task);
            const secondDeadline = deadlineRank(second.task);

            if (firstDeadline !== secondDeadline) {
                return firstDeadline - secondDeadline;
            }

            return first.index - second.index;
        })
        .map(({ task }) => task);
}

export function resolveScheduleWindow(
    window?: Partial<ScheduleWindowConfig>
): ScheduleWindowConfig {
    const resolvedWindow = {
        ...defaultScheduleWindow,
        ...window,
    };

    if (
        !isTimeString(resolvedWindow.normalStartTime) ||
        !isTimeString(resolvedWindow.normalEndTime)
    ) {
        throw new Error("Schedule window times must use HH:mm format.");
    }

    if (!hasValidTimeRange(resolvedWindow.normalStartTime, resolvedWindow.normalEndTime)) {
        throw new Error("Schedule window must satisfy normalStart < normalEnd.");
    }

    return resolvedWindow;
}

function createRuleMeta({
    unscheduled,
}: {
    unscheduled: ScheduleTaskItem[];
}): ScheduleGenerationMeta {
    return {
        requestedMode: "rule",
        usedMode: "rule",
        scheduleSummary: "Rule engine scheduled tasks by priority, deadline, and available time.",
        instructionDeviations: [],
        unscheduled,
    };
}

function createGeneratedBlock({
    userId,
    date,
    task,
    start,
}: {
    userId: string;
    date: string;
    task: SchedulableTask;
    start: number;
}): EngineGeneratedBlock {
    return {
        userId,
        taskId: task.id,
        title: task.title,
        date: `${date}T00:00:00.000Z`,
        startTime: minutesToTime(start),
        endTime: minutesToTime(start + task.estimatedMinutes),
        status: "scheduled",
    };
}

function deadlineRank(task: SchedulableTask) {
    return task.deadline
        ? new Date(`${task.deadline}T00:00:00.000Z`).getTime()
        : Number.POSITIVE_INFINITY;
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
