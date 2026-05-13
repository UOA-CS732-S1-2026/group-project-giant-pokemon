import { getActiveMockTasks } from "@/lib/mockTasks";
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

        const completedBlocks = await ScheduleBlock.find({
            userId: DEMO_USER_ID,
            date,
            status: "completed",
        }).sort({ startTime: 1 });

        await ScheduleBlock.deleteMany({
            userId: DEMO_USER_ID,
            date,
            status: { $in: ["scheduled", "missed"] },
        });

        const tasks = await getActiveMockTasks();
        const blocksToCreate = buildScheduleBlocks(tasks, date, completedBlocks);
        const createdBlocks =
            blocksToCreate.length > 0
                ? await ScheduleBlock.insertMany(blocksToCreate)
                : [];

        const blocks = [...completedBlocks, ...createdBlocks].sort((first, second) =>
            first.startTime.localeCompare(second.startTime)
        );

        return Response.json({ success: true, data: blocks }, { status: 201 });
    } catch (error) {
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

