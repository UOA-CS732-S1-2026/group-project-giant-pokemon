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
                        blocks: [
                            {
                                taskId: "warmup",
                                startTime: "09:00",
                                endTime: "09:30",
                            },
                            {
                                taskId: "hard",
                                startTime: "09:30",
                                endTime: "10:30",
                            },
                        ],
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
                        blocks: [
                            {
                                taskId: "task-1",
                                startTime: "09:00",
                                endTime: "09:30",
                            },
                        ],
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
    it("rejects overlap with occupied blocks", () => {
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
                occupiedBlocks: [
                    {
                        title: "Fixed block",
                        startTime: "09:30",
                        endTime: "10:30",
                        status: "completed",
                    },
                ],
                output: {
                    summary: "This overlaps occupied time.",
                    instructionDeviations: [],
                    blocks: [
                        {
                            taskId: "task-1",
                            startTime: "09:00",
                            endTime: "10:00",
                        },
                    ],
                    unscheduled: [],
                },
            })
        ).toThrow("overlaps");
    });

    it("rejects tasks scheduled after the normal window", () => {
        const tasks = [
            {
                ...baseTask,
                id: "due-today",
                title: "Due today",
                deadline: "2026-05-05",
                estimatedMinutes: 60,
            },
        ];

        expect(() =>
            validateAIOutput({
                date: "2026-05-05",
                tasks,
                output: {
                    summary: "The due task is incorrectly placed after the normal window.",
                    instructionDeviations: [],
                    blocks: [
                        {
                            taskId: "due-today",
                            startTime: "17:00",
                            endTime: "18:00",
                        },
                    ],
                    unscheduled: [],
                },
            })
        ).toThrow("after normal window");
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
                    blocks: [],
                    unscheduled: [],
                },
            })
        ).toThrow("did not account");
    });
});
