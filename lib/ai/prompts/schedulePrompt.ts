import { resolveScheduleWindow } from "@/lib/scheduleEngine/ruleEngine";
import type {
    EngineOccupiedBlock,
    ScheduleWindowConfig,
    SchedulableTask,
} from "@/lib/scheduleEngine/types";

export const AI_SCHEDULE_PROMPT_VERSION = "schedule-ai-v4";

export type AISchedulePromptInput = {
    date: string;
    userId?: string;
    tasks: SchedulableTask[];
    occupiedBlocks?: EngineOccupiedBlock[];
    window?: Partial<ScheduleWindowConfig>;
    instruction?: string;
};

type CompactTask = {
    id: string;
    t: string;
    d?: string;
    st: SchedulableTask["status"];
    p: SchedulableTask["priority"];
    ddl?: string;
    min: number;
};

type CompactOccupiedBlock = {
    id?: string;
    t: string;
    s: string;
    e: string;
    st: EngineOccupiedBlock["status"];
};

export function buildAISchedulePrompt({
    date,
    tasks,
    occupiedBlocks = [],
    window,
    instruction,
}: AISchedulePromptInput): string {
    const resolvedWindow = resolveScheduleWindow(window);
    const normalizedInstruction = normalizeScheduleInstruction(instruction);
    const compactTasks = compactScheduleTasks(tasks);
    const compactOccupiedBlocks = compactOccupied(occupiedBlocks);

    return [
        "You are Taskflow AI Scheduler.",
        `Prompt version: ${AI_SCHEDULE_PROMPT_VERSION}`,
        "Return valid JSON only.",
        "",
        "Create a human-realistic plan using task content, cognitive load, batching, urgency, and user preference; do not merely sort by priority/deadline.",
        "",
        "Scheduling logic:",
        "- Protect long uninterrupted focus time for deep/creative/analytical work.",
        "- Batch shallow admin, communication, cleanup, or quick tasks.",
        "- Use small easy tasks as warm-up only when helpful; do not scatter them through deep work.",
        "- Prefer earlier deadlines and higher priority, but override ordering when content, energy, or batching makes a better day.",
        "- Keep the plan resilient: avoid overpacking and leave natural gaps around occupied blocks.",
        "- If capacity is tight, schedule the highest-value work and mark lower-value work unscheduled.",
        "",
        "Hard constraints: use only task ids; keep durations unchanged; no overlaps; avoid occupied blocks; HH:mm times; schedule only inside the normal window.",
        "",
        "Summary: briefly describe the overall schedule strategy. If any user preference cannot be followed, add concise explanations in instructionDeviations; otherwise use []. Do not explain unscheduled tasks.",
        "",
        `Context: date=${date}; window=${resolvedWindow.normalStartTime}-${resolvedWindow.normalEndTime}`,
        `User preference: ${normalizedInstruction || "None."}`,
        "",
        "Fields: task{id,t,d,st,p,ddl,min}; occupied{id,t,s,e,st}.",
        `Tasks: ${JSON.stringify(compactTasks)}`,
        `Occupied: ${JSON.stringify(compactOccupiedBlocks)}`,
        "",
        "Output shape:",
        JSON.stringify({
            summary: "Brief overall schedule strategy.",
            instructionDeviations: [
                "Only include when the user preference could not be followed.",
            ],
            blocks: [
                {
                    taskId: "task-id",
                    startTime: "09:00",
                    endTime: "10:00",
                },
            ],
            unscheduled: [
                {
                    taskId: "task-id",
                },
            ],
        }),
    ].join("\n");
}

export function normalizeScheduleInstruction(instruction: string | undefined) {
    return instruction?.trim().slice(0, 1_000) ?? "";
}

export function compactScheduleTasks(tasks: SchedulableTask[]): CompactTask[] {
    return tasks.map((task) => ({
        id: task.id,
        t: task.title,
        ...(task.description ? { d: compactText(task.description, 220) } : {}),
        st: task.status,
        p: task.priority,
        ...(task.deadline ? { ddl: task.deadline } : {}),
        min: task.estimatedMinutes,
    }));
}

export function compactOccupied(blocks: EngineOccupiedBlock[]): CompactOccupiedBlock[] {
    return blocks.map((block) => ({
        ...(block.taskId ? { id: block.taskId } : {}),
        t: block.title,
        s: block.startTime,
        e: block.endTime,
        st: block.status,
    }));
}

function compactText(value: string, maxLength: number) {
    const normalized = value.replace(/\s+/g, " ").trim();

    return normalized.length > maxLength
        ? `${normalized.slice(0, maxLength - 3)}...`
        : normalized;
}
