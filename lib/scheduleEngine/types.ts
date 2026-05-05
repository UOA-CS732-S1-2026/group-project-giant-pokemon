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
    overflowEndTime: string;
};

export type EngineOccupiedBlock = {
    taskId?: string;
    title: string;
    startTime: string;
    endTime: string;
    status: ScheduleBlockStatus;
};

export type ScheduleMetaItem = {
    taskId: string;
    title: string;
    reason: string;
};

export type ScheduleReasoningItem = {
    taskId: string;
    title: string;
    reasoning: string;
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
    scheduledReasoning: ScheduleReasoningItem[];
    overflow: ScheduleMetaItem[];
    unscheduled: ScheduleMetaItem[];
};

export type MockScheduleEngineResponse = {
    success: true;
    data: ScheduleBlockAPI[];
    meta: ScheduleGenerationMeta;
};

