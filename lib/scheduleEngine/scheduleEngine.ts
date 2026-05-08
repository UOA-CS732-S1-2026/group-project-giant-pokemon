import {
    generateAISchedule,
} from "@/lib/scheduleEngine/aiEngine";
import {
    generateRuleSchedule,
} from "@/lib/scheduleEngine/ruleEngine";
import type {
    EngineOccupiedBlock,
    ScheduleEngineResult,
    ScheduleGenerationMode,
    ScheduleWindowConfig,
    SchedulableTask,
} from "@/lib/scheduleEngine/types";

type GenerateScheduleEngineInput = {
    date: string;
    userId: string;
    mode: ScheduleGenerationMode;
    tasks: SchedulableTask[];
    occupiedBlocks?: EngineOccupiedBlock[];
    window?: Partial<ScheduleWindowConfig>;
    instruction?: string;
};

export async function generateScheduleWithEngine({
    mode,
    ...input
}: GenerateScheduleEngineInput): Promise<ScheduleEngineResult> {
    return mode === "ai"
        ? generateAISchedule(input)
        : generateRuleSchedule(input);
}

export function parseScheduleGenerationMode(value: unknown): ScheduleGenerationMode {
    if (value === undefined || value === null || value === "") {
        return "rule";
    }

    if (value === "rule" || value === "ai") {
        return value;
    }

    throw new Error("Mode must be rule or ai.");
}

export function parseScheduleInstruction(value: unknown) {
    return typeof value === "string" ? value.trim() : undefined;
}
