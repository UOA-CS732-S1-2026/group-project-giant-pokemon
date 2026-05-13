import { describe, expect, it } from "vitest";
import {
    AI_SCHEDULE_PROMPT_VERSION,
    buildAISchedulePrompt,
    compactScheduleTasks,
    normalizeScheduleInstruction,
} from "@/lib/ai/prompts/schedulePrompt";
import type { SchedulableTask } from "@/lib/scheduleEngine";

const baseTask: SchedulableTask = {
    id: "task-1",
    title: "Base task",
    status: "todo",
    priority: "medium",
    estimatedMinutes: 60,
};

describe("buildAISchedulePrompt", () => {
    it("includes instruction, constraints, tasks, and occupied blocks", () => {
        const tasks = [
            {
                ...baseTask,
                id: "warmup",
                title: "Warm-up admin",
                priority: "low" as const,
            },
        ];

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
        });

        expect(prompt).toContain(`Prompt version: ${AI_SCHEDULE_PROMPT_VERSION}`);
        expect(prompt).toContain("Move easy low-priority work earlier.");
        expect(prompt).toContain("Warm-up admin");
        expect(prompt).toContain("Fixed meeting");
        expect(prompt).toContain("do not merely sort by priority/deadline.");
        expect(prompt).toContain("instructionDeviations");
        expect(prompt).toContain("Do not explain unscheduled tasks.");
        expect(prompt).not.toContain("Rule baseline");
    });

    it("uses the default instruction text when no instruction is provided", () => {
        const tasks = [baseTask];

        const prompt = buildAISchedulePrompt({
            date: "2026-05-05",
            tasks,
        });

        expect(prompt).toContain("User preference: None.");
    });

    it("uses compact prompt inputs instead of full engine objects", () => {
        const tasks = [
            {
                ...baseTask,
                description: "A deep writing task that needs focused attention.",
                deadline: "2026-05-05",
            },
        ];

        const prompt = buildAISchedulePrompt({
            date: "2026-05-05",
            tasks,
        });

        expect(prompt).toContain('"min":60');
        expect(prompt).toContain('"ddl":"2026-05-05"');
        expect(prompt).not.toContain("estimatedMinutes");
        expect(prompt).not.toContain("requestedMode");
    });
});

describe("compactScheduleTasks", () => {
    it("keeps scheduling signal and trims long descriptions", () => {
        const compact = compactScheduleTasks([
            {
                ...baseTask,
                description: " Deep work ".repeat(40),
                deadline: "2026-05-05",
            },
        ]);

        expect(compact[0]).toMatchObject({
            id: "task-1",
            t: "Base task",
            st: "todo",
            p: "medium",
            ddl: "2026-05-05",
            min: 60,
        });
        expect(compact[0].d).toHaveLength(220);
    });
});

describe("normalizeScheduleInstruction", () => {
    it("trims and caps user instruction text", () => {
        const instruction = `  ${"a".repeat(1_050)}  `;

        expect(normalizeScheduleInstruction(instruction)).toHaveLength(1_000);
    });
});
