import { describe, expect, it } from "vitest";
import {
    generateRuleSchedule,
    resolveScheduleWindow,
    sortTasksForRuleEngine,
} from "@/lib/scheduleEngine";
import type { SchedulableTask } from "@/lib/scheduleEngine";

const baseTask: SchedulableTask = {
    id: "task-1",
    title: "Base task",
    status: "todo",
    priority: "medium",
    estimatedMinutes: 60,
};

describe("sortTasksForRuleEngine", () => {
    it("sorts by priority, deadline, and then input order", () => {
        const tasks: SchedulableTask[] = [
            {
                ...baseTask,
                id: "low-urgent",
                title: "Low urgent",
                priority: "low",
                deadline: "2026-05-01",
            },
            {
                ...baseTask,
                id: "high-later",
                title: "High later",
                priority: "high",
                deadline: "2026-05-08",
            },
            {
                ...baseTask,
                id: "high-sooner",
                title: "High sooner",
                priority: "high",
                deadline: "2026-05-05",
            },
            {
                ...baseTask,
                id: "medium-no-deadline-1",
                title: "Medium no deadline 1",
                priority: "medium",
            },
            {
                ...baseTask,
                id: "medium-no-deadline-2",
                title: "Medium no deadline 2",
                priority: "medium",
            },
        ];

        expect(sortTasksForRuleEngine(tasks).map((task) => task.id)).toEqual([
            "high-sooner",
            "high-later",
            "medium-no-deadline-1",
            "medium-no-deadline-2",
            "low-urgent",
        ]);
    });
});

describe("generateRuleSchedule", () => {
    it("generates deterministic blocks and rule summary", () => {
        const result = generateRuleSchedule({
            date: "2026-05-05",
            tasks: [
                {
                    ...baseTask,
                    id: "task-1",
                    title: "First task",
                    priority: "high",
                    estimatedMinutes: 90,
                },
                {
                    ...baseTask,
                    id: "task-2",
                    title: "Second task",
                    priority: "medium",
                    estimatedMinutes: 45,
                },
            ],
        });

        expect(result.blocks).toEqual([
            {
                userId: "demo-user",
                taskId: "task-1",
                title: "First task",
                date: "2026-05-05T00:00:00.000Z",
                startTime: "09:00",
                endTime: "10:30",
                status: "scheduled",
            },
            {
                userId: "demo-user",
                taskId: "task-2",
                title: "Second task",
                date: "2026-05-05T00:00:00.000Z",
                startTime: "10:30",
                endTime: "11:15",
                status: "scheduled",
            },
        ]);
        expect(result.meta).toEqual({
            requestedMode: "rule",
            usedMode: "rule",
            scheduleSummary: "Rule engine scheduled tasks by priority, deadline, and available time.",
            instructionDeviations: [],
            unscheduled: [],
        });
    });

    it("treats scheduled and completed blocks as occupied", () => {
        const result = generateRuleSchedule({
            date: "2026-05-05",
            occupiedBlocks: [
                {
                    title: "Completed block",
                    startTime: "09:00",
                    endTime: "10:00",
                    status: "completed",
                },
                {
                    title: "Scheduled block",
                    startTime: "10:00",
                    endTime: "11:00",
                    status: "scheduled",
                },
            ],
            tasks: [
                {
                    ...baseTask,
                    estimatedMinutes: 60,
                },
            ],
        });

        expect(result.blocks[0]).toMatchObject({
            startTime: "11:00",
            endTime: "12:00",
        });
    });

    it("does not treat missed blocks as occupied", () => {
        const result = generateRuleSchedule({
            date: "2026-05-05",
            occupiedBlocks: [
                {
                    title: "Missed block",
                    startTime: "09:00",
                    endTime: "12:00",
                    status: "missed",
                },
            ],
            tasks: [
                {
                    ...baseTask,
                    estimatedMinutes: 60,
                },
            ],
        });

        expect(result.blocks[0]).toMatchObject({
            startTime: "09:00",
            endTime: "10:00",
        });
    });

    it("marks must-complete tasks unscheduled when the normal window is full", () => {
        const result = generateRuleSchedule({
            date: "2026-05-05",
            occupiedBlocks: [
                {
                    title: "Full work day",
                    startTime: "09:00",
                    endTime: "17:00",
                    status: "completed",
                },
            ],
            tasks: [
                {
                    ...baseTask,
                    id: "due-today",
                    title: "Due today",
                    deadline: "2026-05-05",
                    estimatedMinutes: 120,
                },
            ],
        });

        expect(result.blocks).toEqual([]);
        expect(result.meta.unscheduled).toEqual([
            {
                taskId: "due-today",
                title: "Due today",
            },
        ]);
    });

    it("marks non-must-complete tasks unscheduled when they do not fit normally", () => {
        const result = generateRuleSchedule({
            date: "2026-05-05",
            occupiedBlocks: [
                {
                    title: "Full work day",
                    startTime: "09:00",
                    endTime: "17:00",
                    status: "scheduled",
                },
            ],
            tasks: [
                {
                    ...baseTask,
                    id: "later-task",
                    title: "Later task",
                    deadline: "2026-05-06",
                    estimatedMinutes: 60,
                },
            ],
        });

        expect(result.blocks).toEqual([]);
        expect(result.meta.unscheduled).toEqual([
            {
                taskId: "later-task",
                title: "Later task",
            },
        ]);
    });

    it("marks must-complete tasks unscheduled when they cannot fit normally", () => {
        const result = generateRuleSchedule({
            date: "2026-05-05",
            occupiedBlocks: [
                {
                    title: "Full work day",
                    startTime: "09:00",
                    endTime: "17:00",
                    status: "completed",
                },
            ],
            tasks: [
                {
                    ...baseTask,
                    id: "too-long",
                    title: "Too long",
                    deadline: "2026-05-05",
                    estimatedMinutes: 360,
                },
            ],
        });

        expect(result.blocks).toEqual([]);
        expect(result.meta.unscheduled).toEqual([
            {
                taskId: "too-long",
                title: "Too long",
            },
        ]);
    });

    it("uses future user-level window overrides when provided", () => {
        const result = generateRuleSchedule({
            date: "2026-05-05",
            window: {
                normalStartTime: "08:30",
                normalEndTime: "10:00",
            },
            tasks: [
                {
                    ...baseTask,
                    estimatedMinutes: 45,
                },
            ],
        });

        expect(result.blocks[0]).toMatchObject({
            startTime: "08:30",
            endTime: "09:15",
        });
    });
});

describe("resolveScheduleWindow", () => {
    it("rejects invalid time format", () => {
        expect(() =>
            resolveScheduleWindow({
                normalStartTime: "9am",
            })
        ).toThrow("Schedule window times must use HH:mm format.");
    });

    it("rejects invalid time ordering", () => {
        expect(() =>
            resolveScheduleWindow({
                normalStartTime: "09:00",
                normalEndTime: "09:00",
            })
        ).toThrow("Schedule window must satisfy normalStart < normalEnd.");
    });
});
