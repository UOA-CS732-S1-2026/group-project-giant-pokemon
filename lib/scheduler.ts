import type { MockTask } from "@/lib/mockTasks";
import type { ScheduleBlockStatus } from "@/types/schedule";

export const DEMO_USER_ID = "demo-user";
export const DEFAULT_START_TIME = "09:00";
export const DEFAULT_END_TIME = "17:00";
export const DEFAULT_ESTIMATED_MINUTES = 60;

type ExistingBlock = {
    taskId?: string;
    title: string;
    startTime: string;
    endTime: string;
    status: ScheduleBlockStatus;
};

export type GeneratedScheduleBlock = {
    userId: string;
    taskId?: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: ScheduleBlockStatus;
};

const priorityRank: Record<MockTask["priority"], number> = {
    high: 3,
    medium: 2,
    low: 1,
};

export function parseScheduleDate(value: unknown): Date | null {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export function formatScheduleDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function getTodayScheduleDate(): Date {
    return parseScheduleDate(formatScheduleDate(new Date()))!;
}

export function isScheduleStatus(value: unknown): value is ScheduleBlockStatus {
    return value === "scheduled" || value === "completed" || value === "missed";
}

export function isTimeString(value: unknown): value is string {
    return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function hasValidTimeRange(startTime: string, endTime: string): boolean {
    return timeToMinutes(startTime) < timeToMinutes(endTime);
}

export function sortTasksForScheduling(tasks: MockTask[]): MockTask[] {
    return [...tasks].sort((first, second) => {
        const priorityDifference =
            priorityRank[second.priority] - priorityRank[first.priority];

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        const firstDeadline = first.deadline
            ? new Date(`${first.deadline}T00:00:00.000Z`).getTime()
            : Number.POSITIVE_INFINITY;
        const secondDeadline = second.deadline
            ? new Date(`${second.deadline}T00:00:00.000Z`).getTime()
            : Number.POSITIVE_INFINITY;

        return firstDeadline - secondDeadline;
    });
}

export function buildScheduleBlocks(
    tasks: MockTask[],
    date: Date,
    occupiedBlocks: ExistingBlock[] = []
): GeneratedScheduleBlock[] {
    const sortedTasks = sortTasksForScheduling(tasks);
    const gaps = findAvailableGaps(occupiedBlocks);
    const generatedBlocks: GeneratedScheduleBlock[] = [];
    let gapIndex = 0;
    let cursor = gaps[gapIndex]?.start ?? timeToMinutes(DEFAULT_START_TIME);

    for (const task of sortedTasks) {
        const duration = task.estimatedMinutes ?? DEFAULT_ESTIMATED_MINUTES;

        while (gapIndex < gaps.length) {
            const gap = gaps[gapIndex];
            cursor = Math.max(cursor, gap.start);

            if (cursor + duration <= gap.end) {
                generatedBlocks.push({
                    userId: DEMO_USER_ID,
                    taskId: task.id,
                    title: task.title,
                    date,
                    startTime: minutesToTime(cursor),
                    endTime: minutesToTime(cursor + duration),
                    status: "scheduled",
                });

                cursor += duration;
                break;
            }

            gapIndex += 1;
            cursor = gaps[gapIndex]?.start ?? timeToMinutes(DEFAULT_END_TIME);
        }
    }

    return generatedBlocks;
}

function findAvailableGaps(occupiedBlocks: ExistingBlock[]) {
    const dayStart = timeToMinutes(DEFAULT_START_TIME);
    const dayEnd = timeToMinutes(DEFAULT_END_TIME);
    const occupiedRanges = occupiedBlocks
        .map((block) => ({
            start: Math.max(dayStart, timeToMinutes(block.startTime)),
            end: Math.min(dayEnd, timeToMinutes(block.endTime)),
        }))
        .filter((range) => range.start < range.end)
        .sort((first, second) => first.start - second.start);

    const gaps: Array<{ start: number; end: number }> = [];
    let cursor = dayStart;

    for (const range of occupiedRanges) {
        if (range.start > cursor) {
            gaps.push({ start: cursor, end: range.start });
        }

        cursor = Math.max(cursor, range.end);
    }

    if (cursor < dayEnd) {
        gaps.push({ start: cursor, end: dayEnd });
    }

    return gaps;
}

