import { describe, expect, it } from "vitest";
import { normalizeRequestTasks } from "@/lib/scheduleEngine";

describe("normalizeRequestTasks", () => {
    it("defaults status and estimated minutes, and filters completed tasks", () => {
        expect(
            normalizeRequestTasks([
                {
                    id: "task-1",
                    title: "Open task",
                    priority: "high",
                },
                {
                    id: "task-2",
                    title: "Completed task",
                    status: "completed",
                    priority: "medium",
                    estimatedMinutes: 30,
                },
            ])
        ).toEqual([
            {
                id: "task-1",
                goalId: undefined,
                title: "Open task",
                description: undefined,
                status: "todo",
                priority: "high",
                deadline: undefined,
                estimatedMinutes: 60,
            },
        ]);
    });

    it("rejects duplicate task ids before filtering completed tasks", () => {
        expect(() =>
            normalizeRequestTasks([
                {
                    id: "task-1",
                    title: "Open task",
                    priority: "high",
                },
                {
                    id: "task-1",
                    title: "Completed duplicate",
                    status: "completed",
                    priority: "medium",
                },
            ])
        ).toThrow("Duplicate task id");
    });

    it("rejects invalid deadlines and estimated minutes", () => {
        expect(() =>
            normalizeRequestTasks([
                {
                    id: "task-1",
                    title: "Bad deadline",
                    priority: "high",
                    deadline: "tomorrow",
                },
            ])
        ).toThrow("deadline");

        expect(() =>
            normalizeRequestTasks([
                {
                    id: "task-2",
                    title: "Bad estimate",
                    priority: "high",
                    estimatedMinutes: 481,
                },
            ])
        ).toThrow("estimatedMinutes");
    });
});
