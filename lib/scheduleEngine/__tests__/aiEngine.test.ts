import { describe, expect, it } from "vitest";
import { AIClientError } from "@/lib/ai/errors";
import {
    buildAISchedulePrompt,
    generateAISchedule,
    generateRuleSchedule,
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

describe("buildAISchedulePrompt", () => {
    it("includes instruction, constraints, tasks, occupied blocks, and rule baseline", () => {
        const tasks = [
            {
                ...baseTask,
                id: "warmup",
                title: "Warm-up admin",
                priority: "low" as const,
            },
        ];
        const baseline = generateRuleSchedule({
            date: "2026-05-05",
            tasks,
        });

        const prompt = buildAISchedulePrompt({
            date: "2026-05-05",
            tasks,
            occupiedBlocks: [
                {
                    title: "Fixed meeting",
                    startTime: "10:00",
                    endTime: "11:00",
                    status: "completed",
                },
            ],
            instruction: "Move easy low-priority work earlier.",
            baseline,
        });

        expect(prompt).toContain("Move easy low-priority work earlier.");
        expect(prompt).toContain("Rule baseline JSON");
        expect(prompt).toContain("Fixed or completed occupied blocks cannot move.");
        expect(prompt).toContain("Warm-up admin");
        expect(prompt).toContain("Fixed meeting");
    });
});

describe("generateAISchedule", () => {
    it("returns validated AI output with reasoning", async () => {
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
                        scheduledReasoning: [
                            {
                                taskId: "warmup",
                                reasoning: "Placed first because the user requested easy warm-up work.",
                            },
                            {
                                taskId: "hard",
                                reasoning: "Placed after warm-up while still early in the day.",
                            },
                        ],
                        overflow: [],
                        unscheduled: [],
                    }),
                }),
            }
        );

        expect(result.blocks.map((block) => block.taskId)).toEqual(["warmup", "hard"]);
        expect(result.meta).toMatchObject({
            requestedMode: "ai",
            usedMode: "ai",
            overflow: [],
            unscheduled: [],
        });
        expect(result.meta.scheduledReasoning).toHaveLength(2);
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
                        blocks: [
                            {
                                taskId: "task-1",
                                startTime: "09:00",
                                endTime: "09:30",
                            },
                        ],
                        scheduledReasoning: [
                            {
                                taskId: "task-1",
                                reasoning: "Invalid shorter duration.",
                            },
                        ],
                        overflow: [],
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
        const baseline = generateRuleSchedule({
            date: "2026-05-05",
            tasks,
        });

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
                baseline,
                output: {
                    blocks: [
                        {
                            taskId: "task-1",
                            startTime: "09:00",
                            endTime: "10:00",
                        },
                    ],
                    scheduledReasoning: [
                        {
                            taskId: "task-1",
                            reasoning: "This overlaps occupied time.",
                        },
                    ],
                    overflow: [],
                    unscheduled: [],
                },
            })
        ).toThrow("overlaps");
    });

    it("accepts must-complete overflow with overflow reason", () => {
        const tasks = [
            {
                ...baseTask,
                id: "due-today",
                title: "Due today",
                deadline: "2026-05-05",
                estimatedMinutes: 60,
            },
        ];
        const baseline = generateRuleSchedule({
            date: "2026-05-05",
            tasks,
        });

        const result = validateAIOutput({
            date: "2026-05-05",
            tasks,
            baseline,
            output: {
                blocks: [
                    {
                        taskId: "due-today",
                        startTime: "17:00",
                        endTime: "18:00",
                    },
                ],
                scheduledReasoning: [
                    {
                        taskId: "due-today",
                        reasoning: "Due today and placed in overflow.",
                    },
                ],
                overflow: [
                    {
                        taskId: "due-today",
                        reason: "Due today and could be completed after the normal window.",
                    },
                ],
                unscheduled: [],
            },
        });

        expect(result.blocks[0]).toMatchObject({
            taskId: "due-today",
            startTime: "17:00",
            endTime: "18:00",
        });
        expect(result.meta.overflow[0]).toMatchObject({
            taskId: "due-today",
        });
    });

    it("rejects overflow reasons for tasks that are not actually in overflow", () => {
        const tasks = [
            {
                ...baseTask,
                id: "task-1",
                title: "Task one",
                estimatedMinutes: 60,
            },
        ];
        const baseline = generateRuleSchedule({
            date: "2026-05-05",
            tasks,
        });

        expect(() =>
            validateAIOutput({
                date: "2026-05-05",
                tasks,
                baseline,
                output: {
                    blocks: [
                        {
                            taskId: "task-1",
                            startTime: "09:00",
                            endTime: "10:00",
                        },
                    ],
                    scheduledReasoning: [
                        {
                            taskId: "task-1",
                            reasoning: "Scheduled normally.",
                        },
                    ],
                    overflow: [
                        {
                            taskId: "task-1",
                            reason: "Incorrect overflow reason.",
                        },
                    ],
                    unscheduled: [],
                },
            })
        ).toThrow("overflow reason");
    });

    it("rejects unaccounted tasks", () => {
        const tasks = [
            {
                ...baseTask,
                id: "task-1",
                title: "Task one",
            },
        ];
        const baseline = generateRuleSchedule({
            date: "2026-05-05",
            tasks,
        });

        expect(() =>
            validateAIOutput({
                date: "2026-05-05",
                tasks,
                baseline,
                output: {
                    blocks: [],
                    scheduledReasoning: [],
                    overflow: [],
                    unscheduled: [],
                },
            })
        ).toThrow("did not account");
    });
});
