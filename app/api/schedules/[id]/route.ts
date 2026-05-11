import { dbConnect } from "@/lib/mongodb";
import {
    DEMO_USER_ID,
    hasValidTimeRange,
    isScheduleStatus,
    isTimeString,
    parseScheduleDate,
} from "@/lib/scheduler";
import ScheduleBlock from "@/models/ScheduleBlock";
import mongoose from "mongoose";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        await dbConnect();

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return Response.json(
                { success: false, error: "Invalid schedule block id." },
                { status: 400 }
            );
        }

        const body = await request.json();
        const update: Record<string, unknown> = {};

        if ("title" in body) {
            if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
                return Response.json(
                    { success: false, error: "Title must be a non-empty string." },
                    { status: 400 }
                );
            }

            update.title = body.title.trim();
        }

        if ("date" in body) {
            const parsedDate = parseScheduleDate(body.date);

            if (!parsedDate) {
                return Response.json(
                    { success: false, error: "Date must use YYYY-MM-DD format." },
                    { status: 400 }
                );
            }

            update.date = parsedDate;
        }

        if ("startTime" in body || "endTime" in body) {
            const currentBlock = await ScheduleBlock.findOne({
                _id: id,
                userId: DEMO_USER_ID,
            });

            if (!currentBlock) {
                return Response.json(
                    { success: false, error: "Schedule block not found." },
                    { status: 404 }
                );
            }

            const startTime = body.startTime ?? currentBlock.startTime;
            const endTime = body.endTime ?? currentBlock.endTime;

            if (!isTimeString(startTime) || !isTimeString(endTime)) {
                return Response.json(
                    { success: false, error: "Start time and end time must use HH:mm format." },
                    { status: 400 }
                );
            }

            if (!hasValidTimeRange(startTime, endTime)) {
                return Response.json(
                    { success: false, error: "Start time must be before end time." },
                    { status: 400 }
                );
            }

            update.startTime = startTime;
            update.endTime = endTime;
        }

        if ("status" in body) {
            if (!isScheduleStatus(body.status)) {
                return Response.json(
                    { success: false, error: "Status must be scheduled, completed, or missed." },
                    { status: 400 }
                );
            }

            update.status = body.status;
        }

        if ("taskId" in body) {
            update.taskId =
                typeof body.taskId === "string" && body.taskId.trim()
                    ? body.taskId.trim()
                    : undefined;
        }

        const updatedBlock = await ScheduleBlock.findOneAndUpdate(
            { _id: id, userId: DEMO_USER_ID },
            update,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedBlock) {
            return Response.json(
                { success: false, error: "Schedule block not found." },
                { status: 404 }
            );
        }

        return Response.json({ success: true, data: updatedBlock }, { status: 200 });
    } catch (error) {
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, context: RouteContext) {
    try {
        await dbConnect();

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return Response.json(
                { success: false, error: "Invalid schedule block id." },
                { status: 400 }
            );
        }

        const deletedBlock = await ScheduleBlock.findOneAndDelete({
            _id: id,
            userId: DEMO_USER_ID,
        });

        if (!deletedBlock) {
            return Response.json(
                { success: false, error: "Schedule block not found." },
                { status: 404 }
            );
        }

        return Response.json({ success: true, data: deletedBlock }, { status: 200 });
    } catch (error) {
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

