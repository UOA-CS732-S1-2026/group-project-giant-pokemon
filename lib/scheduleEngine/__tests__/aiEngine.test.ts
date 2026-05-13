import { describe, expect, it } from "vitest";
import { AIClientError } from "@/lib/ai/errors";
import {
    generateAISchedule,
    validateAIOutput,
} from "@/lib/scheduleEngine";
import type { SchedulableTask } from "@/lib/scheduleEngine";

const baseTask: SchedulableTask = {
    id: "task-1",
    title: "Base task",
    status: "todo",
    priority: "medium",
    estimatedMinutes: 60,
};

describe("generateAISchedule", () => {
    it("returns validated AI output with summary", async () => {
        const result = await generateAISchedule(
            {
                date: "2026-05-05",
                tasks: [
                    {
                        ...baseTask,
                        id: "hard",
                        title: "Hard task",
                        priority: "high",
                        estimatedMinutes: 60,
                    },
                    {
                        ...baseTask,
                        id: "warmup",
                        title: "Warm-up admin",
                        priority: "low",
                        estimatedMinutes: 30,
                    },
                ],
                instruction: "Move warm-up work earlier.",
            },
            {
                runPrompt: async () => ({
                    provider: "gemini",
                    model: "test-model",
                    text: JSON.stringify({
                        summary: "Warm-up admin is placed first, followed by deeper work.",
                        instructionDeviations: [],
                        sequence: ["warmup", "hard"],
                        unscheduled: [],
                    }),
                }),
            }
        );

        expect(result.blocks.map((block) => block.taskId)).toEqual(["warmup", "hard"]);
        expect(result.meta).toMatchObject({
            requestedMode: "ai",
            usedMode: "ai",
            scheduleSummary: "Warm-up admin is placed first, followed by deeper work.",
            instructionDeviations: [],
            unscheduled: [],
        });
    });

    it("falls back to rule mode when the provider is unavailable", async () => {
        const result = await generateAISchedule(
            {
                date: "2026-05-05",
                tasks: [
                    {
                        ...baseTask,
                        id: "task-1",
                        title: "Important task",
                        priority: "high",
                    },
                ],
            },
            {
                runPrompt: async () => {
                    throw new AIClientError(
                        "missing_api_key",
                        "GEMINI_API_KEY is not configured."
                    );
                },
            }
        );

        expect(result.blocks[0]).toMatchObject({
            taskId: "task-1",
            startTime: "09:00",
            endTime: "10:00",
        });
        expect(result.meta).toMatchObject({
            requestedMode: "ai",
            usedMode: "rule",
            fallback: {
                code: "missing_api_key",
                message: "GEMINI_API_KEY is not configured.",
            },
        });
    });

    it("builds schedule blocks locally from AI sequence around occupied blocks", async () => {
        const result = await generateAISchedule(
            {
                date: "2026-05-05",
                tasks: [
                    {
                        ...baseTask,
                        id: "deep",
                        title: "Deep work",
                        estimatedMinutes: 60,
                    },
                    {
                        ...baseTask,
                        id: "admin",
                        title: "Admin",
                        estimatedMinutes: 30,
                    },
                ],
                occupiedBlocks: [
                    {
                        title: "Fixed meeting",
                        startTime: "09:30",
                        endTime: "10:30",
                        status: "completed",
                    },
                ],
            },
            {
                runPrompt: async () => ({
                    provider: "gemini",
                    model: "test-model",
                    text: JSON.stringify({
                        summary: "Deep work first, then admin.",
                        instructionDeviations: [],
                        sequence: ["deep", "admin"],
                        unscheduled: [],
                    }),
                }),
            }
        );

        expect(result.blocks).toMatchObject([
            {
                taskId: "deep",
                startTime: "10:30",
                endTime: "11:30",
            },
            {
                taskId: "admin",
                startTime: "11:30",
                endTime: "12:00",
            },
        ]);
    });

    it("falls back to rule mode when AI output fails validation", async () => {
        const result = await generateAISchedule(
            {
                date: "2026-05-05",
                tasks: [
                    {
                        ...baseTask,
                        id: "task-1",
                        title: "One hour task",
                        estimatedMinutes: 60,
                    },
                ],
            },
            {
                runPrompt: async () => ({
                    provider: "gemini",
                    model: "test-model",
                    text: JSON.stringify({
                        summary: "Invalid schedule with a shortened task.",
                        instructionDeviations: [],
                        sequence: [],
                        unscheduled: [],
                    }),
                }),
            }
        );

        expect(result.blocks[0]).toMatchObject({
            taskId: "task-1",
            startTime: "09:00",
            endTime: "10:00",
        });
        expect(result.meta).toMatchObject({
            requestedMode: "ai",
            usedMode: "rule",
            fallback: {
                code: "validation_failed",
            },
        });
    });
});

describe("validateAIOutput", () => {
    it("rejects tasks marked as both sequenced and unscheduled", () => {
        const tasks = [
            {
                ...baseTask,
                id: "task-1",
                title: "Task one",
                estimatedMinutes: 60,
            },
        ];
        expect(() =>
            validateAIOutput({
                date: "2026-05-05",
                tasks,
                output: {
                    summary: "The task should be scheduled.",
                    instructionDeviations: [],
                    sequence: ["task-1"],
                    unscheduled: [{ taskId: "task-1" }],
                },
            })
        ).toThrow("both sequenced and unscheduled");
    });

    it("marks sequenced tasks unscheduled when they do not fit the normal window", () => {
        const tasks = [
            {
                ...baseTask,
                id: "due-today",
                title: "Due today",
                deadline: "2026-05-05",
                estimatedMinutes: 60,
            },
        ];

        const result = validateAIOutput({
            date: "2026-05-05",
            tasks,
            window: {
                normalStartTime: "09:00",
                normalEndTime: "09:30",
            },
            output: {
                summary: "The due task is valuable but cannot fit.",
                instructionDeviations: [],
                sequence: ["due-today"],
                unscheduled: [],
            },
        });

        expect(result.blocks).toEqual([]);
        expect(result.meta.unscheduled).toEqual([
            {
                taskId: "due-today",
                title: "Due today",
            },
        ]);
    });

    it("rejects unaccounted tasks", () => {
        const tasks = [
            {
                ...baseTask,
                id: "task-1",
                title: "Task one",
            },
        ];
        expect(() =>
            validateAIOutput({
                date: "2026-05-05",
                tasks,
                output: {
                    summary: "No tasks scheduled.",
                    instructionDeviations: [],
                    sequence: [],
                    unscheduled: [],
                },
            })
        ).toThrow("did not account");
    });
});
