import { dbConnect } from "@/lib/mongodb";
import {
    DEMO_USER_ID,
    formatScheduleDate,
    getTodayScheduleDate,
    parseScheduleDate,
} from "@/lib/scheduler";
import {
    generateScheduleWithEngine,
    getSchedulableTasks,
    parseScheduleGenerationMode,
    parseScheduleInstruction,
} from "@/lib/scheduleEngine";
import ScheduleBlock from "@/models/ScheduleBlock";
import type { EngineOccupiedBlock } from "@/lib/scheduleEngine";

export async function POST(request: Request) {
    try {
        await dbConnect();

        const body = await request.json().catch(() => ({}));
        const date = body.date ? parseScheduleDate(body.date) : getTodayScheduleDate();

        if (!date) {
            return Response.json(
                { success: false, error: "Date must use YYYY-MM-DD format." },
                { status: 400 }
            );
        }

        const mode = parseScheduleGenerationMode(body.mode);
        const tasks = await getSchedulableTasks({ requestTasks: body.tasks });
        const instruction = parseScheduleInstruction(body.instruction);
        const completedBlocks = await ScheduleBlock.find({
            userId: DEMO_USER_ID,
            date,
            status: "completed",
        }).sort({ startTime: 1 });

        const result = await generateScheduleWithEngine({
            mode,
            date: formatScheduleDate(date),
            userId: DEMO_USER_ID,
            tasks,
            occupiedBlocks: toEngineOccupiedBlocks(completedBlocks),
            instruction,
        });
        const blocksToCreate = result.blocks.map((block) => ({
            ...block,
            date,
        }));

        await ScheduleBlock.deleteMany({
            userId: DEMO_USER_ID,
            date,
            status: { $in: ["scheduled", "missed"] },
        });

        const createdBlocks =
            blocksToCreate.length > 0
                ? await ScheduleBlock.insertMany(blocksToCreate)
                : [];

        const blocks = [...completedBlocks, ...createdBlocks].sort((first, second) =>
            first.startTime.localeCompare(second.startTime)
        );

        return Response.json(
            { success: true, data: blocks, meta: result.meta },
            { status: 201 }
        );
    } catch (error) {
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: error instanceof Error && isBadRequestError(error) ? 400 : 500 }
        );
    }
}

function toEngineOccupiedBlocks(blocks: EngineOccupiedBlock[]): EngineOccupiedBlock[] {
    return blocks.map((block) => ({
        taskId: block.taskId,
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        status: block.status,
    }));
}

function isBadRequestError(error: Error) {
    return (
        error.message.includes("Mode must") ||
        error.message.includes("Duplicate") ||
        error.message.includes("Task") ||
        error.message.includes("Tasks")
    );
}
