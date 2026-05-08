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
import type { EngineOccupiedBlock, ScheduleMetaItem } from "@/lib/scheduleEngine";
import ScheduleBlock from "@/models/ScheduleBlock";

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
        const allTasks = await getSchedulableTasks({ requestTasks: body.tasks });
        const existingBlocks = await ScheduleBlock.find({
            userId: DEMO_USER_ID,
            date,
        }).sort({ startTime: 1 });

        const missedTaskIds = existingBlocks
            .filter((block) => block.status === "missed" && block.taskId)
            .map((block) => block.taskId as string);
        const missedTaskIdSet = new Set(missedTaskIds);
        const tasksToReplan = allTasks.filter((task) => missedTaskIdSet.has(task.id));
        const taskIdsToReplan = new Set(tasksToReplan.map((task) => task.id));
        const unmatchedMissedItems = existingBlocks
            .filter(
                (block) =>
                    block.status === "missed" &&
                    block.taskId &&
                    !taskIdsToReplan.has(block.taskId)
            )
            .map(
                (block): ScheduleMetaItem => ({
                    taskId: block.taskId as string,
                    title: block.title,
                    reason: "Missed block could not be matched to a schedulable task.",
                })
            );
        const blockIdsToReplace = existingBlocks
            .filter(
                (block) =>
                    block.status === "missed" &&
                    block.taskId &&
                    taskIdsToReplan.has(block.taskId)
            )
            .map((block) => block._id);
        const occupiedBlocks = existingBlocks.filter(
            (block) => !blockIdsToReplace.some((id) => id.equals(block._id))
        );

        const result = await generateScheduleWithEngine({
            mode,
            date: formatScheduleDate(date),
            userId: DEMO_USER_ID,
            tasks: tasksToReplan,
            occupiedBlocks: toEngineOccupiedBlocks(occupiedBlocks),
            instruction: parseScheduleInstruction(body.instruction),
        });
        const blocksToCreate = result.blocks.map((block) => ({
            ...block,
            date,
        }));

        if (blockIdsToReplace.length > 0) {
            await ScheduleBlock.deleteMany({
                userId: DEMO_USER_ID,
                date,
                _id: { $in: blockIdsToReplace },
            });
        }

        const createdBlocks =
            blocksToCreate.length > 0
                ? await ScheduleBlock.insertMany(blocksToCreate)
                : [];

        const blocks = [...occupiedBlocks, ...createdBlocks].sort((first, second) =>
            first.startTime.localeCompare(second.startTime)
        );
        const meta = {
            ...result.meta,
            unscheduled: [...result.meta.unscheduled, ...unmatchedMissedItems],
        };

        return Response.json({ success: true, data: blocks, meta }, { status: 200 });
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
