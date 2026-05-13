import { describe, expect, it } from "vitest";
import { createMockScheduleEngineResponse } from "@/lib/scheduleEngine";
import type { SchedulableTask } from "@/lib/scheduleEngine";

const baseTask: SchedulableTask = {
    id: "task-1",
    title: "Finish assignment draft",
    status: "todo",
    priority: "high",
    deadline: "2026-05-05",
    estimatedMinutes: 120,
};

describe("createMockScheduleEngineResponse", () => {
    it("returns API-compatible blocks and AI summary", () => {
        const result = createMockScheduleEngineResponse({
            date: "2026-05-05",
            mode: "ai",
            tasks: [baseTask],
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
            userId: "demo-user",
            taskId: "task-1",
            title: "Finish assignment draft",
            date: "2026-05-05T00:00:00.000Z",
            startTime: "09:00",
            endTime: "11:00",
            status: "scheduled",
        });
        expect(result.meta).toMatchObject({
            requestedMode: "ai",
            usedMode: "ai",
            scheduleSummary: "Mock AI scheduled tasks into available slots within the normal window.",
            instructionDeviations: [],
            unscheduled: [],
        });
    });

    it("returns a rule summary in rule mode", () => {
        const result = createMockScheduleEngineResponse({
            date: "2026-05-05",
            mode: "rule",
            tasks: [baseTask],
        });

        expect(result.meta.requestedMode).toBe("rule");
        expect(result.meta.usedMode).toBe("rule");
        expect(result.meta.scheduleSummary).toBe("Mock rule engine scheduled tasks into available slots.");
    });

    it("marks must-complete tasks unscheduled when the normal window is full", () => {
        const result = createMockScheduleEngineResponse({
            date: "2026-05-05",
            mode: "rule",
            occupiedBlocks: [
                {
                    title: "Existing focus block",
                    startTime: "09:00",
                    endTime: "17:00",
                    status: "completed",
                },
            ],
            tasks: [baseTask],
        });

        expect(result.data).toEqual([]);
        expect(result.meta.unscheduled).toEqual([
            {
                taskId: "task-1",
                title: "Finish assignment draft",
            },
        ]);
    });

    it("marks non-must-complete tasks unscheduled when they cannot fit before 17:00", () => {
        const result = createMockScheduleEngineResponse({
            date: "2026-05-05",
            mode: "rule",
            occupiedBlocks: [
                {
                    title: "Existing focus block",
                    startTime: "09:00",
                    endTime: "17:00",
                    status: "scheduled",
                },
            ],
            tasks: [
                {
                    ...baseTask,
                    deadline: "2026-05-08",
                },
            ],
        });

        expect(result.data).toEqual([]);
        expect(result.meta.unscheduled).toEqual([
            {
                taskId: "task-1",
                title: "Finish assignment draft",
            },
        ]);
    });
});
