import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import {
    getTodayScheduleDate,
    hasValidTimeRange,
    isScheduleStatus,
    isTimeString,
    parseScheduleDate,
} from "@/lib/scheduler";
import ScheduleBlock from "../../../models/ScheduleBlock";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

async function getCurrentUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    try {
        const decoded = verifyToken(token) as { id: string };
        return decoded.id;
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    try {
        await dbConnect();
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get("date");
        const date = dateParam ? parseScheduleDate(dateParam) : getTodayScheduleDate();

        if (!date) {
            return NextResponse.json({ success: false, error: "Date must use YYYY-MM-DD format." }, { status: 400 });
        }

        const blocks = await ScheduleBlock.find({ userId, date }).sort({ startTime: 1 });
        return NextResponse.json({ success: true, data: blocks }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { taskId, title, date, startTime, endTime, status } = body;
        const parsedDate = parseScheduleDate(date);
        const parsedStatus = status ?? "scheduled";

        if (!title || typeof title !== "string" || !title.trim()) {
            return NextResponse.json({ success: false, error: "Title is required and must be a non-empty string." }, { status: 400 });
        }
        if (!parsedDate) {
            return NextResponse.json({ success: false, error: "Date must use YYYY-MM-DD format." }, { status: 400 });
        }
        if (!isTimeString(startTime) || !isTimeString(endTime)) {
            return NextResponse.json({ success: false, error: "Start time and end time must use HH:mm format." }, { status: 400 });
        }
        if (!hasValidTimeRange(startTime, endTime)) {
            return NextResponse.json({ success: false, error: "Start time must be before end time." }, { status: 400 });
        }
        if (!isScheduleStatus(parsedStatus)) {
            return NextResponse.json({ success: false, error: "Status must be scheduled, completed, or missed." }, { status: 400 });
        }

        const newBlock = await ScheduleBlock.create({
            userId,
            taskId: typeof taskId === "string" && taskId.trim() ? taskId.trim() : undefined,
            title: title.trim(),
            date: parsedDate,
            startTime,
            endTime,
            status: parsedStatus,
        });

        return NextResponse.json({ success: true, data: newBlock }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}