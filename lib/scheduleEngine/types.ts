import type { ScheduleBlockAPI, ScheduleBlockStatus } from "@/types/schedule";

export type ScheduleGenerationMode = "rule" | "ai";

export type SchedulableTaskStatus = "todo" | "in_progress";
export type SchedulableTaskPriority = "low" | "medium" | "high";

export type SchedulableTask = {
    id: string;
    goalId?: string;
    title: string;
    description?: string;
    status: SchedulableTaskStatus;
    priority: SchedulableTaskPriority;
    deadline?: string;
    estimatedMinutes: number;
};

export type ScheduleWindowConfig = {
    normalStartTime: string;
    normalEndTime: string;
};

export type EngineOccupiedBlock = {
    taskId?: string;
    title: string;
    startTime: string;
    endTime: string;
    status: ScheduleBlockStatus;
};

export type EngineGeneratedBlock = {
    userId: string;
    taskId: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: "scheduled";
};

export type ScheduleTaskItem = {
    taskId: string;
    title: string;
};

export type ScheduleGenerationFallbackCode =
    | "missing_api_key"
    | "request_failed"
    | "timeout"
    | "invalid_response"
    | "validation_failed";

export type ScheduleGenerationMeta = {
    requestedMode: ScheduleGenerationMode;
    usedMode: ScheduleGenerationMode;
    fallback?: {
        code: ScheduleGenerationFallbackCode;
        message: string;
    };
    scheduleSummary: string;
    instructionDeviations: string[];
    unscheduled: ScheduleTaskItem[];
};

export type ScheduleEngineResult = {
    blocks: EngineGeneratedBlock[];
    meta: ScheduleGenerationMeta;
};

export type MockScheduleEngineResponse = {
    success: true;
    data: ScheduleBlockAPI[];
    meta: ScheduleGenerationMeta;
};
