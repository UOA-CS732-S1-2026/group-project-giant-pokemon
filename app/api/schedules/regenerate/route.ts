import { getActiveMockTasksByIds } from "@/lib/mockTasks";
import { dbConnect } from "@/lib/mongodb";
import {
    DEMO_USER_ID,
    buildScheduleBlocks,
    getTodayScheduleDate,
    parseScheduleDate,
} from "@/lib/scheduler";
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

        const existingBlocks = await ScheduleBlock.find({
            userId: DEMO_USER_ID,
            date,
        }).sort({ startTime: 1 });

        const missedTaskIds = existingBlocks
            .filter((block) => block.status === "missed" && block.taskId)
            .map((block) => block.taskId as string);
        const tasksToReplan = await getActiveMockTasksByIds(missedTaskIds);
        const taskIdsToReplan = new Set(tasksToReplan.map((task) => task.id));
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

        if (blockIdsToReplace.length > 0) {
            await ScheduleBlock.deleteMany({
                userId: DEMO_USER_ID,
                date,
                _id: { $in: blockIdsToReplace },
            });
        }

        const blocksToCreate = buildScheduleBlocks(tasksToReplan, date, occupiedBlocks);
        const createdBlocks =
            blocksToCreate.length > 0
                ? await ScheduleBlock.insertMany(blocksToCreate)
                : [];

        const blocks = [...occupiedBlocks, ...createdBlocks].sort((first, second) =>
            first.startTime.localeCompare(second.startTime)
        );

        return Response.json({ success: true, data: blocks }, { status: 200 });
    } catch (error) {
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

